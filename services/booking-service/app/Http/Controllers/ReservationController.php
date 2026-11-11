<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConfirmReservationRequest;
use App\Http\Requests\ReservationsIndexRequest;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Requests\VerifyQrRequest;
use App\Models\Reservation;
use App\Models\ReservationSeat;
use App\Services\CatalogClientService;
use App\Services\NotificationService;
use App\Services\QrCodeService;
use App\Services\SeatLockService;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SeatLockService $seatLockService,
        private readonly QrCodeService $qrCodeService,
        private readonly NotificationService $notificationService,
        private readonly CatalogClientService $catalogClientService,
    ) {}

    /**
     * GET /api/reservations — paginated list of the authenticated user's reservations.
     */
    public function index(ReservationsIndexRequest $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');

        $this->expireStaleForUser($userId);

        $query = Reservation::query()
            ->where('user_id', $userId)
            ->with(['seats', 'tickets', 'trackings'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('showtime_id')) {
            $query->where('showtime_id', $request->integer('showtime_id'));
        }

        $paginator = $query->paginate($request->integer('per_page', 15));

        return $this->respondSuccess([
            'reservations' => collect($paginator->items())->map(fn (Reservation $r) => $this->formatReservation($r)),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Messages::get('booking.reservations.list'));
    }

    /**
     * POST /api/reservations — create a pending reservation and atomically lock seats in Redis for 10 minutes.
     */
    public function store(StoreReservationRequest $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('auth_user_id');
        $jwtPayload = (array) $request->attributes->get('jwt_payload', []);
        $showtimeId = $request->integer('showtime_id');

        $rawSeats = (array) $request->input('seats', []);
        $seatCodes = array_values(array_unique(array_map(
            fn ($seat) => ReservationSeat::parseSeatCode((string) $seat)['seat_code'],
            $rawSeats
        )));
        sort($seatCodes);

        // 0. Consult catalog-service to validate showtime & physical auditorium seats and enrich metadata
        $bearerToken = $request->bearerToken();
        $catalogShowtime = $this->catalogClientService->getShowtime($showtimeId, $bearerToken);
        if (! $catalogShowtime['found']) {
            return $this->respondError('La función seleccionada no existe en catalog-service', 404);
        }

        $catalogSeatsResult = $this->catalogClientService->getShowtimeSeats($showtimeId, $bearerToken);
        if ($catalogSeatsResult['reachable'] && $catalogSeatsResult['seats'] !== []) {
            $validPhysicalSeats = [];
            foreach ($catalogSeatsResult['seats'] as $cs) {
                if (($cs['status'] ?? 'active') === 'active') {
                    $validPhysicalSeats[strtoupper($cs['row_label'].$cs['seat_number'])] = true;
                }
            }

            foreach ($seatCodes as $requestedSeat) {
                if (! isset($validPhysicalSeats[$requestedSeat])) {
                    return $this->respondError(
                        Messages::get('common.validation_errors'),
                        422,
                        ['seats' => ["El asiento {$requestedSeat} no existe o no está habilitado en la sala de esta función en catalog-service."]]
                    );
                }
            }
        }

        $showtimeData = $catalogShowtime['data'] ?? [];
        $movieTitle = $request->input('movie_title') ?? ($showtimeData['movie']['title'] ?? null);
        $cinemaName = $request->input('cinema_name') ?? ($showtimeData['auditorium']['cinema']['name'] ?? null);
        $auditoriumName = $request->input('auditorium_name') ?? ($showtimeData['auditorium']['name'] ?? null);
        $showtimeStart = $request->input('showtime_start') ?? ($showtimeData['start_time'] ?? null);

        // 1. Clean up any expired pending reservations for this showtime in DB
        $this->expireStaleForShowtime($showtimeId);

        // 2. Check if any seat is already permanently confirmed in PostgreSQL
        $alreadyConfirmed = ReservationSeat::query()
            ->where('showtime_id', $showtimeId)
            ->whereIn('seat_code', $seatCodes)
            ->where('status', ReservationSeat::STATUS_CONFIRMED)
            ->whereHas('reservation', function ($q) {
                $q->where('status', Reservation::STATUS_CONFIRMED);
            })
            ->pluck('seat_code')
            ->unique()
            ->values()
            ->all();

        if ($alreadyConfirmed !== []) {
            return $this->respondError(
                Messages::get('booking.reservation.seat_unavailable'),
                409,
                ['seats' => ['Asientos ya vendidos: '.implode(', ', $alreadyConfirmed)]]
            );
        }

        // 3. Calculate ticket breakdown and total amount (using catalog-service prices if available)
        $catalogTicketTypes = is_array($showtimeData['ticket_types'] ?? null) ? $showtimeData['ticket_types'] : [];
        $ticketBreakdown = $this->resolveTicketsBreakdown($request, count($seatCodes), $catalogTicketTypes);
        $totalTickets = array_sum(array_column($ticketBreakdown, 'quantity'));
        $totalAmount = array_sum(array_column($ticketBreakdown, 'subtotal'));

        $bookingCode = Reservation::generateUniqueBookingCode();
        $ttlSeconds = (int) config('booking.seat_lock_ttl_seconds', 600);

        // 4. Atomically lock all seats in Redis (TTL = 600 seconds / 10 minutes)
        $lockResult = $this->seatLockService->acquireSeats(
            $showtimeId,
            $seatCodes,
            $bookingCode,
            $userId,
            $ttlSeconds,
        );

        if (! $lockResult['acquired']) {
            return $this->respondError(
                Messages::get('booking.reservation.seat_unavailable'),
                409,
                ['seats' => ["El asiento {$lockResult['conflicting_seat']} está siendo reservado por otro usuario."]]
            );
        }

        // 5. Persist the pending reservation in PostgreSQL
        try {
            $reservation = DB::transaction(function () use (
                $bookingCode,
                $userId,
                $jwtPayload,
                $showtimeId,
                $movieTitle,
                $cinemaName,
                $auditoriumName,
                $showtimeStart,
                $totalTickets,
                $totalAmount,
                $lockResult,
                $seatCodes,
                $ticketBreakdown,
                $ttlSeconds,
            ): Reservation {
                $reservation = Reservation::create([
                    'booking_code' => $bookingCode,
                    'user_id' => $userId,
                    'user_name' => $jwtPayload['name'] ?? null,
                    'user_email' => $jwtPayload['email'] ?? null,
                    'showtime_id' => $showtimeId,
                    'movie_title' => $movieTitle,
                    'cinema_name' => $cinemaName,
                    'auditorium_name' => $auditoriumName,
                    'showtime_start' => $showtimeStart,
                    'total_tickets' => $totalTickets,
                    'total_amount' => $totalAmount,
                    'status' => Reservation::STATUS_PENDING,
                    'expires_at' => $lockResult['expires_at'],
                ]);

                foreach ($seatCodes as $seatCode) {
                    $parsed = ReservationSeat::parseSeatCode($seatCode);
                    $reservation->seats()->create([
                        'showtime_id' => $showtimeId,
                        'seat_code' => $parsed['seat_code'],
                        'row_label' => $parsed['row_label'],
                        'seat_number' => $parsed['seat_number'],
                        'status' => ReservationSeat::STATUS_LOCKED,
                    ]);
                }

                foreach ($ticketBreakdown as $ticketItem) {
                    $reservation->tickets()->create($ticketItem);
                }

                $this->notificationService->recordEvent(
                    $reservation,
                    'seats_locked_redis',
                    'Asientos bloqueados temporalmente en Redis por 10 minutos',
                    [
                        'seats' => $seatCodes,
                        'ttl_seconds' => $ttlSeconds,
                        'expires_at' => $lockResult['expires_at']->toIso8601String(),
                    ]
                );

                return $reservation->load(['seats', 'tickets', 'trackings']);
            });
        } catch (\Throwable $e) {
            // Release Redis locks if DB transaction fails
            $this->seatLockService->releaseSeats($showtimeId, $seatCodes, $bookingCode);

            throw $e;
        }

        return $this->respondSuccess(
            $this->formatReservation($reservation),
            Messages::get('booking.reservation.store'),
            201
        );
    }

    /**
     * GET /api/reservations/{code} — detail of a reservation by booking_code (EC-XXXXXX) or id.
     */
    public function show(Request $request, string $code): JsonResponse
    {
        $reservation = $this->findAuthorizedReservation($request, $code);

        if ($reservation instanceof JsonResponse) {
            return $reservation;
        }

        $reservation = $this->checkAndExpireIfPastDue($reservation);

        return $this->respondSuccess(
            $this->formatReservation($reservation->load(['seats', 'tickets', 'trackings'])),
            Messages::get('booking.reservation.show')
        );
    }

    /**
     * POST /api/reservations/{code}/confirm — confirm payment within the 10-minute lock window
     * and generate the digital QR code.
     */
    public function confirm(ConfirmReservationRequest $request, string $code): JsonResponse
    {
        $reservation = $this->findAuthorizedReservation($request, $code);

        if ($reservation instanceof JsonResponse) {
            return $reservation;
        }

        if ($reservation->status === Reservation::STATUS_CONFIRMED) {
            return $this->respondError(Messages::get('booking.reservation.already_confirmed'), 409);
        }

        if (in_array($reservation->status, [Reservation::STATUS_CANCELLED, Reservation::STATUS_EXPIRED], true)) {
            return $this->respondError(Messages::get('booking.reservation.cannot_confirm'), 409);
        }

        $seatCodes = $reservation->seats()->pluck('seat_code')->all();

        // Check whether the 10-minute lock window in DB or Redis has expired
        $locksStillValid = ! $reservation->isExpired()
            && $this->seatLockService->verifyLocksOwnedBy(
                $reservation->showtime_id,
                $seatCodes,
                $reservation->booking_code
            );

        if (! $locksStillValid) {
            $reservation->update(['status' => Reservation::STATUS_EXPIRED]);
            $reservation->seats()->update(['status' => ReservationSeat::STATUS_RELEASED]);
            $this->seatLockService->releaseSeats($reservation->showtime_id, $seatCodes, $reservation->booking_code);

            $this->notificationService->recordEvent(
                $reservation,
                'reservation_expired',
                'El bloqueo temporal de 10 minutos expiró antes de confirmar el pago',
                ['seats' => $seatCodes]
            );

            return $this->respondError(Messages::get('booking.reservation.expired'), 409);
        }

        // Confirm reservation, persist permanent seat allocation, and generate digital QR
        $confirmedReservation = DB::transaction(function () use ($reservation, $request, $seatCodes): Reservation {
            // Final guard against double confirmation in DB
            $conflict = ReservationSeat::query()
                ->where('showtime_id', $reservation->showtime_id)
                ->whereIn('seat_code', $seatCodes)
                ->where('status', ReservationSeat::STATUS_CONFIRMED)
                ->where('reservation_id', '!=', $reservation->id)
                ->exists();

            if ($conflict) {
                abort(409, Messages::get('booking.reservation.seat_unavailable'));
            }

            $reservation->confirmed_at = now();
            $reservation->status = Reservation::STATUS_CONFIRMED;
            $reservation->payment_method = (string) $request->input('payment_method', 'card');
            $reservation->payment_reference = (string) ($request->input('payment_reference') ?: 'PAY-'.strtoupper(Str::random(8)));

            $qrData = $this->qrCodeService->generateForReservation($reservation, $seatCodes);
            $reservation->qr_payload = $qrData['payload'];
            $reservation->qr_svg = $qrData['svg'];
            $reservation->save();

            $reservation->seats()->update(['status' => ReservationSeat::STATUS_CONFIRMED]);

            $this->notificationService->recordEvent(
                $reservation,
                'payment_confirmed',
                'Pago confirmado y asientos asignados definitivamente',
                [
                    'payment_method' => $reservation->payment_method,
                    'payment_reference' => $reservation->payment_reference,
                    'total_amount' => $reservation->total_amount,
                ]
            );

            $this->notificationService->recordEvent(
                $reservation,
                'qr_generated',
                'Código QR digital firmado generado exitosamente',
                ['booking_code' => $reservation->booking_code]
            );

            return $reservation;
        });

        // Release temporary Redis locks now that seats are permanently confirmed in DB
        $this->seatLockService->releaseSeats(
            $confirmedReservation->showtime_id,
            $seatCodes,
            $confirmedReservation->booking_code
        );

        // Send asynchronous/simulated confirmation notification
        $this->notificationService->sendConfirmationNotification($confirmedReservation, $seatCodes);

        return $this->respondSuccess(
            $this->formatReservation($confirmedReservation->load(['seats', 'tickets', 'trackings'])),
            Messages::get('booking.reservation.confirm')
        );
    }

    /**
     * POST /api/reservations/{code}/cancel — cancel a reservation and immediately release Redis locks.
     */
    public function cancel(Request $request, string $code): JsonResponse
    {
        $reservation = $this->findAuthorizedReservation($request, $code);

        if ($reservation instanceof JsonResponse) {
            return $reservation;
        }

        if (in_array($reservation->status, [Reservation::STATUS_CANCELLED, Reservation::STATUS_EXPIRED], true)) {
            return $this->respondError(Messages::get('booking.reservation.cannot_cancel'), 409);
        }

        $seatCodes = $reservation->seats()->pluck('seat_code')->all();

        DB::transaction(function () use ($reservation, $seatCodes): void {
            $reservation->update([
                'status' => Reservation::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);

            $reservation->seats()->update(['status' => ReservationSeat::STATUS_RELEASED]);

            $this->notificationService->recordEvent(
                $reservation,
                'reservation_cancelled',
                'Reserva cancelada por el usuario y asientos liberados',
                ['seats' => $seatCodes]
            );
        });

        $this->seatLockService->releaseSeats($reservation->showtime_id, $seatCodes, $reservation->booking_code);

        return $this->respondSuccess(
            $this->formatReservation($reservation->fresh(['seats', 'tickets', 'trackings'])),
            Messages::get('booking.reservation.cancel')
        );
    }

    /**
     * GET /api/reservations/{code}/qr — retrieve the digital QR code for a confirmed reservation.
     */
    public function qr(Request $request, string $code): JsonResponse
    {
        $reservation = $this->findAuthorizedReservation($request, $code);

        if ($reservation instanceof JsonResponse) {
            return $reservation;
        }

        $reservation = $this->checkAndExpireIfPastDue($reservation);

        if ($reservation->status !== Reservation::STATUS_CONFIRMED || ! $reservation->qr_svg) {
            return $this->respondError(Messages::get('booking.reservation.qr_not_ready'), 409);
        }

        return $this->respondSuccess([
            'booking_code' => $reservation->booking_code,
            'status' => $reservation->status,
            'showtime_id' => $reservation->showtime_id,
            'movie_title' => $reservation->movie_title,
            'cinema_name' => $reservation->cinema_name,
            'auditorium_name' => $reservation->auditorium_name,
            'seats' => $reservation->seats()->pluck('seat_code')->all(),
            'confirmed_at' => $reservation->confirmed_at?->toIso8601String(),
            'qr_payload' => json_decode((string) $reservation->qr_payload, true),
            'qr_payload_raw' => $reservation->qr_payload,
            'qr_svg' => $reservation->qr_svg,
            'qr_svg_data_uri' => 'data:image/svg+xml;base64,'.base64_encode((string) $reservation->qr_svg),
        ], Messages::get('booking.reservation.qr_show'));
    }

    /**
     * GET /api/reservations/{code}/tracking — chronological tracking events and lock countdown.
     */
    public function tracking(Request $request, string $code): JsonResponse
    {
        $reservation = $this->findAuthorizedReservation($request, $code);

        if ($reservation instanceof JsonResponse) {
            return $reservation;
        }

        $reservation = $this->checkAndExpireIfPastDue($reservation);

        $remainingSeconds = 0;
        if ($reservation->status === Reservation::STATUS_PENDING && $reservation->expires_at->isFuture()) {
            $remainingSeconds = (int) now()->diffInSeconds($reservation->expires_at, false);
        }

        return $this->respondSuccess([
            'booking_code' => $reservation->booking_code,
            'status' => $reservation->status,
            'showtime_id' => $reservation->showtime_id,
            'seats' => $reservation->seats()->pluck('seat_code')->all(),
            'total_tickets' => $reservation->total_tickets,
            'total_amount' => $reservation->total_amount,
            'expires_at' => $reservation->expires_at->toIso8601String(),
            'remaining_lock_seconds' => max(0, $remainingSeconds),
            'confirmed_at' => $reservation->confirmed_at?->toIso8601String(),
            'cancelled_at' => $reservation->cancelled_at?->toIso8601String(),
            'events' => $reservation->trackings()->get(),
        ], Messages::get('booking.reservation.tracking'));
    }

    /**
     * POST /api/qr/verify — verify authenticity of a digital QR code payload.
     */
    public function verifyQr(VerifyQrRequest $request): JsonResponse
    {
        $rawInput = $request->input('qr_payload');
        $payloadString = is_array($rawInput)
            ? (string) json_encode($rawInput, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            : (string) $rawInput;

        $verification = $this->qrCodeService->verifyPayload($payloadString);

        if (! $verification['valid'] || ! is_array($verification['data'])) {
            return $this->respondError(Messages::get('booking.reservation.qr_invalid'), 422);
        }

        $bookingCode = (string) ($verification['data']['booking_code'] ?? '');
        $reservation = Reservation::where('booking_code', $bookingCode)
            ->with(['seats', 'tickets'])
            ->first();

        if (! $reservation || $reservation->status !== Reservation::STATUS_CONFIRMED) {
            return $this->respondError(Messages::get('booking.reservation.qr_invalid'), 422);
        }

        return $this->respondSuccess([
            'valid' => true,
            'booking_code' => $reservation->booking_code,
            'status' => $reservation->status,
            'showtime_id' => $reservation->showtime_id,
            'user_id' => $reservation->user_id,
            'seats' => $reservation->seats->pluck('seat_code')->all(),
            'confirmed_at' => $reservation->confirmed_at?->toIso8601String(),
        ], Messages::get('booking.reservation.qr_verified'));
    }

    /**
     * Resolve ticket items from either explicit `tickets` array, `adult_tickets` + `discount_tickets`,
     * or fallback to seat count * catalog-service price.
     *
     * @param  array<int, array<string, mixed>>  $catalogTicketTypes
     * @return array<int, array{ticket_type: string, quantity: int, unit_price: float, subtotal: float}>
     */
    private function resolveTicketsBreakdown(
        StoreReservationRequest $request,
        int $seatCount,
        array $catalogTicketTypes = [],
    ): array {
        if ($request->filled('tickets') && is_array($request->input('tickets'))) {
            $items = [];
            foreach ($request->input('tickets') as $item) {
                $qty = (int) $item['quantity'];
                $price = (float) $item['unit_price'];
                $items[] = [
                    'ticket_type' => (string) $item['ticket_type'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'subtotal' => round($qty * $price, 2),
                ];
            }

            return $items;
        }

        // Look up prices from catalog-service ticket_types if available
        $catalogGeneralPrice = null;
        $catalogDiscountPrice = null;
        foreach ($catalogTicketTypes as $tt) {
            $name = strtolower((string) ($tt['name'] ?? ''));
            if (str_contains($name, 'general') || str_contains($name, 'adulto')) {
                $catalogGeneralPrice = (float) $tt['price'];
            } elseif (str_contains($name, '3ra') || str_contains($name, 'descuento')) {
                $catalogDiscountPrice = (float) $tt['price'];
            }
        }

        $adultPrice = (float) ($request->input('unit_price') ?? $catalogGeneralPrice ?? config('booking.default_adult_price', 15.00));
        $discountPrice = (float) ($catalogDiscountPrice ?? round($adultPrice * 0.5, 2));

        $adultTickets = (int) $request->input('adult_tickets', 0);
        $discountTickets = (int) $request->input('discount_tickets', 0);

        if ($adultTickets + $discountTickets > 0) {
            $items = [];
            if ($adultTickets > 0) {
                $items[] = [
                    'ticket_type' => 'Adulto',
                    'quantity' => $adultTickets,
                    'unit_price' => $adultPrice,
                    'subtotal' => round($adultTickets * $adultPrice, 2),
                ];
            }
            if ($discountTickets > 0) {
                $items[] = [
                    'ticket_type' => '3ra Edad / Descuento',
                    'quantity' => $discountTickets,
                    'unit_price' => $discountPrice,
                    'subtotal' => round($discountTickets * $discountPrice, 2),
                ];
            }

            return $items;
        }

        return [
            [
                'ticket_type' => 'General',
                'quantity' => $seatCount,
                'unit_price' => $adultPrice,
                'subtotal' => round($seatCount * $adultPrice, 2),
            ],
        ];
    }

    private function findAuthorizedReservation(Request $request, string $code): Reservation|JsonResponse
    {
        $query = Reservation::query();

        if (ctype_digit($code)) {
            $reservation = $query->find((int) $code);
        } else {
            $reservation = $query->where('booking_code', strtoupper(trim($code)))->first();
        }

        if (! $reservation) {
            return $this->respondError(Messages::get('booking.reservation.not_found'), 404);
        }

        $userId = (int) $request->attributes->get('auth_user_id');
        $jwtPayload = (array) $request->attributes->get('jwt_payload', []);
        $role = $jwtPayload['role'] ?? null;

        if ($reservation->user_id !== $userId && ! in_array($role, ['admin', 'organizer'], true)) {
            return $this->respondError(Messages::get('common.forbidden'), 403);
        }

        return $reservation;
    }

    private function checkAndExpireIfPastDue(Reservation $reservation): Reservation
    {
        if ($reservation->isExpired()) {
            $seatCodes = $reservation->seats()->pluck('seat_code')->all();
            $reservation->update(['status' => Reservation::STATUS_EXPIRED]);
            $reservation->seats()->update(['status' => ReservationSeat::STATUS_RELEASED]);
            $this->seatLockService->releaseSeats($reservation->showtime_id, $seatCodes, $reservation->booking_code);

            $this->notificationService->recordEvent(
                $reservation,
                'reservation_expired',
                'El tiempo de reserva de 10 minutos expiró automáticamente',
                ['seats' => $seatCodes]
            );
        }

        return $reservation;
    }

    private function expireStaleForShowtime(int $showtimeId): void
    {
        $staleReservations = Reservation::query()
            ->where('showtime_id', $showtimeId)
            ->where('status', Reservation::STATUS_PENDING)
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($staleReservations as $stale) {
            $this->checkAndExpireIfPastDue($stale);
        }
    }

    private function expireStaleForUser(int $userId): void
    {
        $staleReservations = Reservation::query()
            ->where('user_id', $userId)
            ->where('status', Reservation::STATUS_PENDING)
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($staleReservations as $stale) {
            $this->checkAndExpireIfPastDue($stale);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function formatReservation(Reservation $reservation): array
    {
        $remainingSeconds = 0;
        if ($reservation->status === Reservation::STATUS_PENDING && $reservation->expires_at->isFuture()) {
            $remainingSeconds = (int) now()->diffInSeconds($reservation->expires_at, false);
        }

        return [
            'id' => $reservation->id,
            'booking_code' => $reservation->booking_code,
            'user_id' => $reservation->user_id,
            'user_name' => $reservation->user_name,
            'user_email' => $reservation->user_email,
            'showtime_id' => $reservation->showtime_id,
            'movie_title' => $reservation->movie_title,
            'cinema_name' => $reservation->cinema_name,
            'auditorium_name' => $reservation->auditorium_name,
            'showtime_start' => $reservation->showtime_start?->toIso8601String(),
            'total_tickets' => $reservation->total_tickets,
            'total_amount' => $reservation->total_amount,
            'status' => $reservation->status,
            'payment_method' => $reservation->payment_method,
            'payment_reference' => $reservation->payment_reference,
            'seats' => $reservation->relationLoaded('seats')
                ? $reservation->seats->pluck('seat_code')->values()->all()
                : [],
            'seat_details' => $reservation->relationLoaded('seats') ? $reservation->seats : [],
            'tickets' => $reservation->relationLoaded('tickets') ? $reservation->tickets : [],
            'qr_svg' => $reservation->qr_svg,
            'qr_svg_data_uri' => $reservation->qr_svg
                ? 'data:image/svg+xml;base64,'.base64_encode($reservation->qr_svg)
                : null,
            'expires_at' => $reservation->expires_at->toIso8601String(),
            'remaining_lock_seconds' => max(0, $remainingSeconds),
            'confirmed_at' => $reservation->confirmed_at?->toIso8601String(),
            'cancelled_at' => $reservation->cancelled_at?->toIso8601String(),
            'created_at' => $reservation->created_at?->toIso8601String(),
            'trackings' => $reservation->relationLoaded('trackings') ? $reservation->trackings : [],
        ];
    }
}

