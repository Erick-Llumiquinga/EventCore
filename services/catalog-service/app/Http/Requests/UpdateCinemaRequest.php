<?php

namespace App\Http\Requests;

class UpdateCinemaRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'filled', 'string', 'max:255'],
            'address' => ['sometimes', 'filled', 'string', 'max:255'],
            'city' => ['sometimes', 'filled', 'string', 'max:100'],
        ];
    }
}
