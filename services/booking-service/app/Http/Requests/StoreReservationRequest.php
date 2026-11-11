<?php

namespace App\Http\Requests;

class StoreReservationRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'showtime_id' => ['required', 'integer', 'min:1'],
            'seats' => ['required', 'array', 'min:1', 'max:15'],
            'seats.*' => ['required', 'string', 'distinct', 'regex:/^[A-Za-z]+[1-9][0-9]*$/'],
            'tickets' => ['nullable', 'array', 'min:1'],
            'tickets.*.ticket_type' => ['required_with:tickets', 'string', 'max:60'],
            'tickets.*.quantity' => ['required_with:tickets', 'integer', 'min:1', 'max:15'],
            'tickets.*.unit_price' => ['required_with:tickets', 'numeric', 'min:0'],
            'adult_tickets' => ['nullable', 'integer', 'min:0', 'max:15'],
            'discount_tickets' => ['nullable', 'integer', 'min:0', 'max:15'],
            'unit_price' => ['nullable', 'numeric', 'min:0'],
            'movie_title' => ['nullable', 'string', 'max:255'],
            'cinema_name' => ['nullable', 'string', 'max:255'],
            'auditorium_name' => ['nullable', 'string', 'max:255'],
            'showtime_start' => ['nullable', 'date'],
        ];
    }
}

