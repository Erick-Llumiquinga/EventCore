<?php

namespace App\Http\Requests;

use App\Models\Movie;
use Illuminate\Validation\Rule;

class UpdateMovieRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'filled', 'string', 'max:255'],
            'description' => ['sometimes', 'filled', 'string', 'max:5000'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'rating' => ['sometimes', 'string', 'max:10'],
            'poster_url' => ['nullable', 'string', 'url', 'max:2048'],
            'status' => ['sometimes', 'string', Rule::in(Movie::STATUSES)],
        ];
    }
}
