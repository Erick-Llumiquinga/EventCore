<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoviesIndexRequest;
use App\Models\Movie;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class MovieController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/movies — paginated list (defaults: page=1, per_page=15),
     * with optional ?cinema_id= and ?status= filters.
     */
    public function index(MoviesIndexRequest $request): JsonResponse
    {
        $query = Movie::query()->orderBy('title');

        if ($request->filled('cinema_id')) {
            $query->whereHas('showtimes.auditorium', function ($auditoriumQuery) use ($request) {
                $auditoriumQuery->where('cinema_id', $request->integer('cinema_id'));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $paginator = $query->paginate($request->integer('per_page', 15));

        return $this->respondSuccess([
            'movies' => collect($paginator->items()),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Messages::get('catalog.movies.list'));
    }

    /**
     * GET /api/movies/{movie} — movie detail with its showtimes
     * (each with auditorium, cinema and ticket types).
     */
    public function show(string $movie): JsonResponse
    {
        $record = $this->findMovie($movie);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        return $this->respondSuccess(
            $record->load(['showtimes.auditorium.cinema', 'showtimes.ticketTypes']),
            Messages::get('catalog.movie.show')
        );
    }

    private function findMovie(string $movie): ?Movie
    {
        return Str::isUuid($movie) ? Movie::find($movie) : null;
    }
}
