<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMovieRequest;
use App\Http\Requests\UpdateMovieRequest;
use App\Models\Movie;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class MovieController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/movies — create a movie (admin).
     */
    public function store(StoreMovieRequest $request): JsonResponse
    {
        $data = $request->validated();
        $userId = $request->attributes->get('auth_user_id');

        $movie = Movie::create([
            ...$data,
            'status' => $data['status'] ?? Movie::STATUS_DRAFT,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return $this->respondSuccess($movie, Messages::get('catalog.movie.store'), 201);
    }

    /**
     * PUT /api/movies/{movie} — update a movie (admin).
     */
    public function update(UpdateMovieRequest $request, string $movie): JsonResponse
    {
        $record = $this->findMovie($movie);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->update([
            ...$request->validated(),
            'updated_by' => $request->attributes->get('auth_user_id'),
        ]);

        return $this->respondSuccess($record->fresh(), Messages::get('catalog.movie.update'));
    }

    /**
     * DELETE /api/movies/{movie} — soft delete a movie (admin).
     */
    public function destroy(string $movie): JsonResponse
    {
        $record = $this->findMovie($movie);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->delete();

        return $this->respondSuccess(['id' => $record->id], Messages::get('catalog.movie.delete'));
    }

    private function findMovie(string $movie): ?Movie
    {
        return Str::isUuid($movie) ? Movie::find($movie) : null;
    }
}
