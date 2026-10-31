<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreShowtimeRequest;
use App\Http\Requests\UpdateShowtimeRequest;
use App\Models\Showtime;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class ShowtimeController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/showtimes — create a showtime (admin).
     */
    public function store(StoreShowtimeRequest $request): JsonResponse
    {
        $showtime = Showtime::create([
            ...$request->validated(),
            'created_by' => $request->attributes->get('auth_user_id'),
            'updated_by' => $request->attributes->get('auth_user_id'),
        ]);

        return $this->respondSuccess($showtime, Messages::get('catalog.showtime.store'), 201);
    }

    /**
     * PUT /api/showtimes/{showtime} — update a showtime (admin).
     */
    public function update(UpdateShowtimeRequest $request, string $showtime): JsonResponse
    {
        $record = $this->findShowtime($showtime);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->update([
            ...$request->validated(),
            'updated_by' => $request->attributes->get('auth_user_id'),
        ]);

        return $this->respondSuccess($record->fresh(), Messages::get('catalog.showtime.update'));
    }

    /**
     * DELETE /api/showtimes/{showtime} — delete a showtime (admin).
     */
    public function destroy(string $showtime): JsonResponse
    {
        $record = $this->findShowtime($showtime);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->delete();

        return $this->respondSuccess(['id' => $record->id], Messages::get('catalog.showtime.delete'));
    }

    private function findShowtime(string $showtime): ?Showtime
    {
        return ctype_digit($showtime) ? Showtime::find((int) $showtime) : null;
    }
}
