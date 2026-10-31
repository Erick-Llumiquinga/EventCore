<?php

namespace App\Http\Controllers;

use App\Http\Requests\CinemasIndexRequest;
use App\Models\Cinema;
use App\Models\Movie;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class CinemaController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/cinemas — paginated list (defaults: page=1, per_page=15),
     * with optional ?city= filter.
     */
    public function index(CinemasIndexRequest $request): JsonResponse
    {
        $query = Cinema::query()->withCount('auditoriums')->orderBy('name');

        if ($request->filled('city')) {
            $query->whereRaw('LOWER(city) = ?', [mb_strtolower($request->string('city'))]);
        }

        $paginator = $query->paginate($request->integer('per_page', 15));

        return $this->respondSuccess([
            'cinemas' => collect($paginator->items()),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
        ], Messages::get('catalog.cinemas.list'));
    }

    /**
     * GET /api/cinemas/{cinema} — single cinema with its movies
     * (each with its showtimes and auditorium).
     */
    public function show(string $cinema): JsonResponse
    {
        $record = $this->findCinema($cinema);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $movies = Movie::query()
            ->whereHas('showtimes.auditorium', function ($auditoriumQuery) use ($record) {
                $auditoriumQuery->where('cinema_id', $record->id);
            })
            ->with(['showtimes' => function ($showtimeQuery) use ($record) {
                $showtimeQuery->whereHas('auditorium', function ($auditoriumQuery) use ($record) {
                    $auditoriumQuery->where('cinema_id', $record->id);
                })->with('auditorium')->orderBy('start_time');
            }])
            ->orderBy('title')
            ->get();

        return $this->respondSuccess($record->setRelation('movies', $movies), Messages::get('catalog.cinema.show'));
    }

    private function findCinema(string $cinema): ?Cinema
    {
        return ctype_digit($cinema) ? Cinema::find((int) $cinema) : null;
    }
}
