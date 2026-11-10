<?php

namespace App\Http\Requests;

use App\Models\Reservation;
use Illuminate\Validation\Rule;

class ReservationsIndexRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'nullable',
                'string',
                Rule::in([
                    Reservation::STATUS_PENDING,
                    Reservation::STATUS_CONFIRMED,
                    Reservation::STATUS_CANCELLED,
                    Reservation::STATUS_EXPIRED,
                ]),
            ],
            'showtime_id' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}

