<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Seat extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_MAINTENANCE = 'maintenance';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_MAINTENANCE,
    ];

    protected $fillable = [
        'auditorium_id',
        'row_label',
        'seat_number',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'seat_number' => 'integer',
        ];
    }

    public function auditorium(): BelongsTo
    {
        return $this->belongsTo(Auditorium::class);
    }
}
