<?php

namespace App\Http\Requests;

use App\Models\Seat;
use Illuminate\Validation\Rule;

class UpdateSeatRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'row_label' => ['sometimes', 'filled', 'string', 'max:10'],
            'seat_number' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'status' => ['sometimes', 'string', Rule::in(Seat::STATUSES)],
        ];
    }
}
