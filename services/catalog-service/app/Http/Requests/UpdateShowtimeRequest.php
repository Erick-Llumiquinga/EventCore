<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateShowtimeRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'movie_id' => ['sometimes', 'uuid', Rule::exists('movies', 'id')->whereNull('deleted_at')],
            'auditorium_id' => ['sometimes', 'integer', 'min:1', Rule::exists('auditoriums', 'id')],
            'start_time' => ['sometimes', 'filled', 'date'],
            'format' => ['sometimes', 'filled', 'string', 'max:50'],
        ];
    }
}
