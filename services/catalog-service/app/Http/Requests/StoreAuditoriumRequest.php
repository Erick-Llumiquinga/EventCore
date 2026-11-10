<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreAuditoriumRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cinema_id' => ['required', 'integer', 'min:1', Rule::exists('cinemas', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'capacity' => ['required', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
