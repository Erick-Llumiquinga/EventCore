<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory, HasUuids;

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'title',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
        ];
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
