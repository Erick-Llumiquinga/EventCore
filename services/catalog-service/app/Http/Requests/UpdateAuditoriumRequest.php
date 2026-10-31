<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateAuditoriumRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cinema_id' => ['sometimes', 'integer', 'min:1', Rule::exists('cinemas', 'id')->whereNull('deleted_at')],
            'name' => ['sometimes', 'filled', 'string', 'max:255'],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
