<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cinema extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'address',
        'city',
        'created_by',
        'updated_by',
    ];

    public function auditoriums(): HasMany
    {
        return $this->hasMany(Auditorium::class);
    }

    /**
     * Movies on this cinema's billboard (explicit many-to-many).
     */
    public function movies(): BelongsToMany
    {
        return $this->belongsToMany(Movie::class, 'movie_cinema')->withTimestamps();
    }

    /**
     * Showtimes played in any auditorium of this cinema.
     */
    public function showtimes(): HasManyThrough
    {
        return $this->hasManyThrough(Showtime::class, Auditorium::class);
    }
}
