<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\ReservationSeat;
use App\Services\CatalogClientService;
use App\Services\SeatLockService;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShowtimeAvailabilityController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SeatLockService $seatLockService,
        private readonly CatalogClientService $catalogClientService,
    ) {}

    /**
     * GET /api/showtimes/{showtime}/seats — fetches the showtime and physical seat map
     * from catalog-service (`catalog_db`), then merges confirmed seats from `booking_db`
     * and temporary 10-minute locks from Redis.
     */
    public function seats(Request $request, string $showtime): JsonResponse
    {
        if (! ctype_digit($showtime) || (int) $showtime < 1) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $showtimeId = (int) $showtime;
        $bearerToken = $request->bearerToken();

        // 1. Query catalog-service for showtime metadata & physical auditorium seats
        $catalogShowtime = $this->catalogClientService->getShowtime($showtimeId, $bearerToken);
        if (! $catalogShowtime['found']) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $catalogSeatsResult = $this->catalogClientService->getShowtimeSeats($showtimeId, $bearerToken);

        // Expire any stale pending DB records for this showtime first.
        $this->expireStalePendingReservations($showtimeId);

        // 2. Seats permanently sold (confirmed in PostgreSQL booking_db)
        $confirmedSeats = ReservationSeat::query()
            ->where('showtime_id', $showtimeId)
            ->where('status', ReservationSeat::STATUS_CONFIRMED)
            ->whereHas('reservation', function ($q) {
                $q->where('status', Reservation::STATUS_CONFIRMED);
            })
            ->orderBy('row_label')
            ->orderBy('seat_number')
            ->pluck('seat_code')
            ->unique()
            ->values()
            ->all();

        // 3. Seats temporarily locked in Redis (10-minute hold)
        $activeRedisLocks = $this->seatLockService->getActiveLocksForShowtime($showtimeId);
        $lockedSeats = collect($activeRedisLocks)
            ->pluck('seat_code')
            ->diff($confirmedSeats)
            ->unique()
            ->values()
            ->all();

        $occupiedSeats = array_values(array_unique(array_merge($confirmedSeats, $lockedSeats)));
        sort($occupiedSeats);

        // 4. Build the unified seat map combining catalog-service seats + booking status
        $confirmedLookup = array_flip($confirmedSeats);
        $lockedLookup = array_flip($lockedSeats);
        $seatMap = [];

        foreach ($catalogSeatsResult['seats'] as $catalogSeat) {
            $seatCode = strtoupper($catalogSeat['row_label'].$catalogSeat['seat_number']);
            $physicalStatus = $catalogSeat['status'] ?? 'active';

            $bookingStatus = 'available';
            if ($physicalStatus !== 'active') {
                $bookingStatus = 'maintenance';
            } elseif (isset($confirmedLookup[$seatCode])) {
                $bookingStatus = 'confirmed';
            } elseif (isset($lockedLookup[$seatCode])) {
                $bookingStatus = 'locked';
            }

            $seatMap[] = [
                'id' => $catalogSeat['id'] ?? null,
                'seat_code' => $seatCode,
                'row_label' => $catalogSeat['row_label'],
                'seat_number' => $catalogSeat['seat_number'],
                'booking_status' => $bookingStatus,
                'is_available' => $bookingStatus === 'available',
            ];
        }

        return $this->respondSuccess([
            'showtime_id' => $showtimeId,
            'showtime' => $catalogShowtime['data'],
            'confirmed_seats' => $confirmedSeats,
            'locked_seats' => $lockedSeats,
            'occupied_seats' => $occupiedSeats,
            'seat_map' => $seatMap,
            'locks_detail' => $activeRedisLocks,
            'lock_ttl_seconds' => (int) config('booking.seat_lock_ttl_seconds', 600),
        ], Messages::get('booking.seats.availability'));
    }

    private function expireStalePendingReservations(int $showtimeId): void
    {
        $staleReservations = Reservation::query()
            ->where('showtime_id', $showtimeId)
            ->where('status', Reservation::STATUS_PENDING)
            ->where('expires_at', '<=', now())
            ->with('seats')
            ->get();

        foreach ($staleReservations as $stale) {
            $stale->update(['status' => Reservation::STATUS_EXPIRED]);
            $stale->seats()->update(['status' => ReservationSeat::STATUS_RELEASED]);
        }
    }
}
