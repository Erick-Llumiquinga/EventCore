<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Reservation extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'booking_code',
        'user_id',
        'user_name',
        'user_email',
        'showtime_id',
        'movie_title',
        'cinema_name',
        'auditorium_name',
        'showtime_start',
        'total_tickets',
        'total_amount',
        'status',
        'payment_method',
        'payment_reference',
        'qr_payload',
        'qr_svg',
        'expires_at',
        'confirmed_at',
        'cancelled_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'showtime_id' => 'integer',
            'total_tickets' => 'integer',
            'total_amount' => 'float',
            'showtime_start' => 'datetime',
            'expires_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Generate a unique booking code matching frontend convention: EC-XXXXXX.
     */
    public static function generateUniqueBookingCode(): string
    {
        do {
            $code = 'EC-'.strtoupper(Str::random(6));
        } while (self::where('booking_code', $code)->exists());

        return $code;
    }

    public function seats(): HasMany
    {
        return $this->hasMany(ReservationSeat::class)->orderBy('row_label')->orderBy('seat_number');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(ReservationTicket::class);
    }

    public function trackings(): HasMany
    {
        return $this->hasMany(ReservationTracking::class)->orderBy('id');
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->expires_at->isPast();
    }
}

