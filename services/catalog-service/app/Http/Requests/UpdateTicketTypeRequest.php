<?php

namespace App\Http\Requests;

class UpdateTicketTypeRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'filled', 'string', 'max:100'],
            'price' => ['sometimes', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }
}
