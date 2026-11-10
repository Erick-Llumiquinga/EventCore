<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationTicket extends Model
{
    protected $fillable = [
        'reservation_id',
        'ticket_type',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'reservation_id' => 'integer',
            'quantity' => 'integer',
            'unit_price' => 'float',
            'subtotal' => 'float',
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}

