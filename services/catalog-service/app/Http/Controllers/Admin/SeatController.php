<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSeatRequest;
use App\Http\Requests\UpdateSeatRequest;
use App\Models\Auditorium;
use App\Models\Seat;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class SeatController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/seats — create a seat in an auditorium (admin).
     */
    public function store(StoreSeatRequest $request): JsonResponse
    {
        $auditorium = Auditorium::find($request->integer('auditorium_id'));

        if (! $auditorium) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $seat = $auditorium->seats()->create([
            ...$request->validated(),
            'status' => $request->validated()['status'] ?? Seat::STATUS_ACTIVE,
        ]);

        return $this->respondSuccess($seat, Messages::get('catalog.seat.store'), 201);
    }

    /**
     * PUT /api/seats/{seat} — update a seat (admin).
     */
    public function update(UpdateSeatRequest $request, string $seat): JsonResponse
    {
        $record = $this->findSeat($seat);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->update($request->validated());

        return $this->respondSuccess($record->fresh(), Messages::get('catalog.seat.update'));
    }

    /**
     * DELETE /api/seats/{seat} — delete a seat (admin).
     */
    public function destroy(string $seat): JsonResponse
    {
        $record = $this->findSeat($seat);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->delete();

        return $this->respondSuccess(['id' => $record->id], Messages::get('catalog.seat.delete'));
    }

    private function findSeat(string $seat): ?Seat
    {
        return ctype_digit($seat) ? Seat::find((int) $seat) : null;
    }
}
