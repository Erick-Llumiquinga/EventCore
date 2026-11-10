<?php

namespace App\Http\Requests;

class ConfirmReservationRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'payment_method' => ['nullable', 'string', 'max:50'],
            'card_holder' => ['nullable', 'string', 'max:120'],
            'card_last_four' => ['nullable', 'string', 'max:4'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
        ];
    }
}

