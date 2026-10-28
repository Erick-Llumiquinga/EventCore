<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCinemaRequest;
use App\Http\Requests\UpdateCinemaRequest;
use App\Models\Cinema;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class CinemaController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/cinemas — create a cinema (admin).
     */
    public function store(StoreCinemaRequest $request): JsonResponse
    {
        $userId = $request->attributes->get('auth_user_id');

        $cinema = Cinema::create([
            ...$request->validated(),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return $this->respondSuccess($cinema, Messages::get('catalog.cinema.store'), 201);
    }

    /**
     * PUT /api/cinemas/{cinema} — update a cinema (admin).
     */
    public function update(UpdateCinemaRequest $request, string $cinema): JsonResponse
    {
        $record = $this->findCinema($cinema);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->update([
            ...$request->validated(),
            'updated_by' => $request->attributes->get('auth_user_id'),
        ]);

        return $this->respondSuccess($record->fresh(), Messages::get('catalog.cinema.update'));
    }

    /**
     * DELETE /api/cinemas/{cinema} — soft delete a cinema (admin).
     * Refused with 409 while the cinema still has auditoriums or showtimes.
     */
    public function destroy(string $cinema): JsonResponse
    {
        $record = $this->findCinema($cinema);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        if ($record->auditoriums()->exists() || $record->showtimes()->exists()) {
            return $this->respondError(Messages::get('catalog.cinema.delete_blocked'), 409);
        }

        $record->delete();

        return $this->respondSuccess(['id' => $record->id], Messages::get('catalog.cinema.delete'));
    }

    private function findCinema(string $cinema): ?Cinema
    {
        return ctype_digit($cinema) ? Cinema::find((int) $cinema) : null;
    }
}
