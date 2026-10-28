<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Auditorium extends Model
{
    /**
     * Laravel's pluralizer turns "Auditorium" into the Latin "auditoria";
     * the migration creates the table as "auditoriums".
     */
    protected $table = 'auditoriums';

    protected $fillable = [
        'cinema_id',
        'name',
        'capacity',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
        ];
    }

    public function cinema(): BelongsTo
    {
        return $this->belongsTo(Cinema::class);
    }

    public function showtimes(): HasMany
    {
        return $this->hasMany(Showtime::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }
}
