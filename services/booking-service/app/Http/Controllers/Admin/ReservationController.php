<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReservationsIndexRequest;
use App\Models\Reservation;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class ReservationController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/admin/reservations — list all reservations and summary metrics for organizers/admins.
     */
    public function index(ReservationsIndexRequest $request): JsonResponse
    {
        $query = Reservation::query()
            ->with(['seats', 'tickets', 'trackings'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('showtime_id')) {
            $query->where('showtime_id', $request->integer('showtime_id'));
        }

        $paginator = $query->paginate($request->integer('per_page', 15));

        $summary = [
            'total_confirmed' => Reservation::where('status', Reservation::STATUS_CONFIRMED)->count(),
            'total_pending_locks' => Reservation::where('status', Reservation::STATUS_PENDING)
                ->where('expires_at', '>', now())
                ->count(),
            'total_cancelled' => Reservation::where('status', Reservation::STATUS_CANCELLED)->count(),
            'total_expired' => Reservation::where('status', Reservation::STATUS_EXPIRED)->count(),
            'confirmed_revenue' => (float) Reservation::where('status', Reservation::STATUS_CONFIRMED)->sum('total_amount'),
        ];

        return $this->respondSuccess([
            'reservations' => collect($paginator->items()),
            'summary' => $summary,
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Messages::get('booking.reservations.list'));
    }
}

