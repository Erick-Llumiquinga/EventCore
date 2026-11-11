<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationSeat extends Model
{
    public const STATUS_LOCKED = 'locked';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_RELEASED = 'released';

    protected $fillable = [
        'reservation_id',
        'showtime_id',
        'seat_code',
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
            'reservation_id' => 'integer',
            'showtime_id' => 'integer',
            'seat_number' => 'integer',
        ];
    }

    /**
     * Parse a seat code like "A3" or "F12" into [row_label, seat_number].
     *
     * @return array{row_label: string, seat_number: int, seat_code: string}
     */
    public static function parseSeatCode(string $seatCode): array
    {
        $normalized = strtoupper(trim($seatCode));

        if (preg_match('/^([A-Z]+)(\d+)$/', $normalized, $matches)) {
            $row = $matches[1];
            $num = (int) $matches[2];

            return [
                'row_label' => $row,
                'seat_number' => $num,
                'seat_code' => $row.$num,
            ];
        }

        return [
            'row_label' => substr($normalized, 0, 1) ?: 'A',
            'seat_number' => 1,
            'seat_code' => $normalized,
        ];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}

