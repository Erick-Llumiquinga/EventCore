<?php

namespace App\Http\Controllers;

use App\Http\Requests\ShowtimesIndexRequest;
use App\Models\Showtime;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class ShowtimeController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/showtimes — paginated list (defaults: page=1, per_page=15).
     * At least one of ?movie_id=, ?cinema_id= or ?date= is required.
     */
    public function index(ShowtimesIndexRequest $request): JsonResponse
    {
        $query = Showtime::query()
            ->with(['movie', 'auditorium.cinema', 'ticketTypes'])
            ->orderBy('start_time');

        if ($request->filled('movie_id')) {
            $query->where('movie_id', $request->string('movie_id'));
        }

        if ($request->filled('cinema_id')) {
            $query->whereHas('auditorium', function ($auditoriumQuery) use ($request) {
                $auditoriumQuery->where('cinema_id', $request->integer('cinema_id'));
            });
        }

        if ($request->filled('date')) {
            $date = $request->date('date');
            $query->whereBetween('start_time', [
                $date->startOfDay(),
                $date->copy()->endOfDay(),
            ]);
        }

        $paginator = $query->paginate($request->integer('per_page', 15));

        return $this->respondSuccess([
            'showtimes' => collect($paginator->items()),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Messages::get('catalog.showtimes.list'));
    }

    /**
     * GET /api/showtimes/{showtime} — single showtime with movie,
     * auditorium, cinema and ticket types.
     */
    public function show(string $showtime): JsonResponse
    {
        $record = $this->findShowtime($showtime);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        return $this->respondSuccess(
            $record->load(['movie', 'auditorium.cinema', 'ticketTypes']),
            Messages::get('catalog.showtime.show')
        );
    }

    /**
     * GET /api/showtimes/{showtime}/ticket-types — ticket types and
     * prices for a showtime.
     */
    public function ticketTypes(string $showtime): JsonResponse
    {
        $record = $this->findShowtime($showtime);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        return $this->respondSuccess(
            $record->ticketTypes()->orderBy('name')->get(),
            Messages::get('catalog.ticket_types.list')
        );
    }

    /**
     * GET /api/showtimes/{showtime}/seats — seat map of the auditorium
     * assigned to a showtime.
     */
    public function seats(string $showtime): JsonResponse
    {
        $record = $this->findShowtime($showtime);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        return $this->respondSuccess(
            $record->auditorium->seats()
                ->orderBy('row_label')
                ->orderBy('seat_number')
                ->get(),
            Messages::get('catalog.seats.list')
        );
    }

    private function findShowtime(string $showtime): ?Showtime
    {
        return ctype_digit($showtime) ? Showtime::find((int) $showtime) : null;
    }
}
