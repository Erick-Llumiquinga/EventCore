<?php

namespace App\Http\Controllers;

use App\Http\Requests\CinemasIndexRequest;
use App\Models\Cinema;
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

        return $this->respondSuccess(
            $query->paginate($request->integer('per_page', 15)),
            Messages::get('catalog.cinemas.list')
        );
    }

    /**
     * GET /api/cinemas/{cinema} — single cinema with its auditoriums.
     */
    public function show(string $cinema): JsonResponse
    {
        $record = $this->findCinema($cinema);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        return $this->respondSuccess($record->load('auditoriums'), Messages::get('catalog.cinema.show'));
    }

    private function findCinema(string $cinema): ?Cinema
    {
        return ctype_digit($cinema) ? Cinema::find((int) $cinema) : null;
    }
}
