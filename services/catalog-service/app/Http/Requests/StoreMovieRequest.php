<?php

namespace App\Http\Requests;

use App\Models\Movie;
use Illuminate\Validation\Rule;

class StoreMovieRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1000'],
            'rating' => ['required', 'string', 'max:10'],
            'poster_url' => ['nullable', 'string', 'url', 'max:2048'],
            'status' => ['nullable', 'string', Rule::in(Movie::STATUSES)],
        ];
    }
}
