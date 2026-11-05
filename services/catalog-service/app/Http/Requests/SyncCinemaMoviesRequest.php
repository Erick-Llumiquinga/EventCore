<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class SyncCinemaMoviesRequest extends BaseFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'movie_ids' => ['present', 'array'],
            'movie_ids.*' => ['uuid', Rule::exists('movies', 'id')->whereNull('deleted_at')],
        ];
    }
}
