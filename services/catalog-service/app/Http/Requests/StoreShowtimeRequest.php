<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreShowtimeRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'movie_id' => ['required', 'uuid', Rule::exists('movies', 'id')->whereNull('deleted_at')],
            'auditorium_id' => ['required', 'integer', 'min:1', Rule::exists('auditoriums', 'id')],
            'start_time' => ['required', 'date', 'after:now'],
            'format' => ['required', 'string', 'max:50'],
        ];
    }
}
