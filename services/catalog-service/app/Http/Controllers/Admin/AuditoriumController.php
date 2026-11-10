<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAuditoriumRequest;
use App\Http\Requests\UpdateAuditoriumRequest;
use App\Models\Auditorium;
use App\Models\Cinema;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class AuditoriumController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/auditoriums — create an auditorium in a cinema (admin).
     */
    public function store(StoreAuditoriumRequest $request): JsonResponse
    {
        $cinema = Cinema::find($request->integer('cinema_id'));

        if (! $cinema) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $auditorium = $cinema->auditoriums()->create([
            ...$request->validated(),
            'created_by' => $request->attributes->get('auth_user_id'),
            'updated_by' => $request->attributes->get('auth_user_id'),
        ]);

        return $this->respondSuccess($auditorium, Messages::get('catalog.auditorium.store'), 201);
    }

    /**
     * PUT /api/auditoriums/{auditorium} — update an auditorium (admin).
     */
    public function update(UpdateAuditoriumRequest $request, string $auditorium): JsonResponse
    {
        $record = $this->findAuditorium($auditorium);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->update([
            ...$request->validated(),
            'updated_by' => $request->attributes->get('auth_user_id'),
        ]);

        return $this->respondSuccess($record->fresh(), Messages::get('catalog.auditorium.update'));
    }

    /**
     * DELETE /api/auditoriums/{auditorium} — delete an auditorium (admin).
     * Refused with 409 while the auditorium still has showtimes.
     */
    public function destroy(string $auditorium): JsonResponse
    {
        $record = $this->findAuditorium($auditorium);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        if ($record->showtimes()->exists()) {
            return $this->respondError(Messages::get('catalog.auditorium.delete_blocked'), 409);
        }

        $record->delete();

        return $this->respondSuccess(['id' => $record->id], Messages::get('catalog.auditorium.delete'));
    }

    private function findAuditorium(string $auditorium): ?Auditorium
    {
        return ctype_digit($auditorium) ? Auditorium::find((int) $auditorium) : null;
    }
}
