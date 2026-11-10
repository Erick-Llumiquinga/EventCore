<?php

namespace App\Http\Requests;

use App\Models\Movie;
use Illuminate\Validation\Rule;

class MoviesIndexRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cinema_id' => ['nullable', 'integer', 'min:1', Rule::exists('cinemas', 'id')->whereNull('deleted_at')],
            'status' => ['nullable', 'string', Rule::in(Movie::STATUSES)],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
