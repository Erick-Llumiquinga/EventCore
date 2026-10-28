<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketTypeRequest;
use App\Http\Requests\UpdateTicketTypeRequest;
use App\Models\Showtime;
use App\Models\TicketType;
use EventCore\Messages\ApiResponse;
use EventCore\Messages\Messages;
use Illuminate\Http\JsonResponse;

class TicketTypeController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/ticket-types — create a ticket type for a showtime (admin).
     */
    public function store(StoreTicketTypeRequest $request): JsonResponse
    {
        $showtime = Showtime::find($request->integer('showtime_id'));

        if (! $showtime) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $ticketType = $showtime->ticketTypes()->create($request->validated());

        return $this->respondSuccess($ticketType, Messages::get('catalog.ticket_type.store'), 201);
    }

    /**
     * PUT /api/ticket-types/{ticketType} — update a ticket type (admin).
     */
    public function update(UpdateTicketTypeRequest $request, string $ticketType): JsonResponse
    {
        $record = $this->findTicketType($ticketType);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->update($request->validated());

        return $this->respondSuccess($record->fresh(), Messages::get('catalog.ticket_type.update'));
    }

    /**
     * DELETE /api/ticket-types/{ticketType} — delete a ticket type (admin).
     */
    public function destroy(string $ticketType): JsonResponse
    {
        $record = $this->findTicketType($ticketType);

        if (! $record) {
            return $this->respondError(Messages::get('endpoint.not_found'), 404);
        }

        $record->delete();

        return $this->respondSuccess(['id' => $record->id], Messages::get('catalog.ticket_type.delete'));
    }

    private function findTicketType(string $ticketType): ?TicketType
    {
        return ctype_digit($ticketType) ? TicketType::find((int) $ticketType) : null;
    }
}
