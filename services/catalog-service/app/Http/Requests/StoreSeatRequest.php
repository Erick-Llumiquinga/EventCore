<?php

namespace App\Http\Requests;

use App\Models\Seat;
use Illuminate\Validation\Rule;

class StoreSeatRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'auditorium_id' => ['required', 'integer', 'min:1', Rule::exists('auditoriums', 'id')],
            'row_label' => ['required', 'string', 'max:10'],
            'seat_number' => ['required', 'integer', 'min:1', 'max:1000'],
            'status' => ['nullable', 'string', Rule::in(Seat::STATUSES)],
        ];
    }
}
