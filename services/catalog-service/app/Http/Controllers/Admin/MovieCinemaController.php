<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SyncCinemaMoviesRequest;
use App\Models\Cinema;
use App\Models\Movie;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class MovieCinemaController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/cinemas/{cinema}/movies — replace the cinema's billboard
     * with the given movie ids (admin).
     */
    public function sync(SyncCinemaMoviesRequest $request, string $cinema): JsonResponse
    {
        $record = $this->findCinema($cinema);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $movieIds = $request->validated('movie_ids');

        $record->movies()->sync($movieIds);

        return $this->respondSuccess(
            $record->movies()->orderBy('title')->get(),
            Messages::get('catalog.cinema.movies_sync')
        );
    }

    /**
     * DELETE /api/cinemas/{cinema}/movies/{movie} — remove one movie
     * from the cinema's billboard (admin).
     */
    public function detach(string $cinema, string $movie): JsonResponse
    {
        $record = $this->findCinema($cinema);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $movieRecord = Movie::find($movie);

        if (! $movieRecord) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->movies()->detach($movieRecord->id);

        return $this->respondSuccess(
            ['movie_id' => $movieRecord->id],
            Messages::get('catalog.cinema.movies_detach')
        );
    }

    private function findCinema(string $cinema): ?Cinema
    {
        return ctype_digit($cinema) ? Cinema::find((int) $cinema) : null;
    }
}
