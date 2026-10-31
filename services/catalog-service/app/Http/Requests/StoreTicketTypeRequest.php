<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreTicketTypeRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'showtime_id' => ['required', 'integer', 'min:1', Rule::exists('showtimes', 'id')],
            'name' => ['required', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
