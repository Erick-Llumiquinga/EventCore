<?php

namespace App\Http\Requests;

class ShowtimesIndexRequest extends BaseFormRequest
{
    /**
     * At least one of ?movie_id=, ?cinema_id= or ?date= is required.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'movie_id' => ['required_without_all:cinema_id,date', 'nullable', 'uuid'],
            'cinema_id' => ['required_without_all:movie_id,date', 'nullable', 'integer', 'min:1'],
            'date' => ['required_without_all:movie_id,cinema_id', 'nullable', 'date'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
