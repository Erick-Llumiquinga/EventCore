<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class SeatLockService
{
    /**
     * Build the atomic Redis cache key for a single seat in a showtime.
     */
    public function seatKey(int $showtimeId, string $seatCode): string
    {
        $normalized = strtoupper(trim($seatCode));

        return "booking:lock:showtime:{$showtimeId}:seat:{$normalized}";
    }

    /**
     * Build the index key that tracks active seat codes for a showtime.
     */
    public function showtimeIndexKey(int $showtimeId): string
    {
        return "booking:lock:showtime:{$showtimeId}:index";
    }

    /**
     * Atomically lock all requested seats in Redis for 10 minutes (600s).
     * If any seat is already locked by another user, rolls back all locks acquired in this attempt.
     *
     * @param  array<int, string>  $seatCodes
     * @return array{acquired: bool, conflicting_seat: ?string, expires_at: Carbon, ttl_seconds: int}
     */
    public function acquireSeats(
        int $showtimeId,
        array $seatCodes,
        string $bookingCode,
        int $userId,
        ?int $ttlSeconds = null,
    ): array {
        $ttl = $ttlSeconds ?? (int) config('booking.seat_lock_ttl_seconds', 600);
        $now = now();
        $expiresAt = $now->copy()->addSeconds($ttl);

        // Sort seat codes deterministically to prevent lock-order race conditions.
        $normalizedSeats = array_values(array_unique(array_map(
            fn (string $seat) => strtoupper(trim($seat)),
            $seatCodes
        )));
        sort($normalizedSeats);

        $acquiredKeys = [];
        $acquiredSeats = [];

        foreach ($normalizedSeats as $seatCode) {
            $key = $this->seatKey($showtimeId, $seatCode);
            $payload = [
                'booking_code' => $bookingCode,
                'user_id' => $userId,
                'showtime_id' => $showtimeId,
                'seat_code' => $seatCode,
                'locked_at' => $now->toIso8601String(),
                'expires_at' => $expiresAt->toIso8601String(),
            ];

            // Cache::add executes an atomic Lua script in Redis (EXISTS < 1 + SETEX).
            $locked = Cache::add($key, $payload, $ttl);

            if (! $locked) {
                // Compensating rollback: release any seats locked during this failed batch.
                foreach ($acquiredKeys as $rollbackKey) {
                    Cache::forget($rollbackKey);
                }

                return [
                    'acquired' => false,
                    'conflicting_seat' => $seatCode,
                    'expires_at' => $expiresAt,
                    'ttl_seconds' => $ttl,
                ];
            }

            $acquiredKeys[] = $key;
            $acquiredSeats[] = $seatCode;
        }

        $this->registerSeatsInShowtimeIndex($showtimeId, $acquiredSeats, $ttl);

        return [
            'acquired' => true,
            'conflicting_seat' => null,
            'expires_at' => $expiresAt,
            'ttl_seconds' => $ttl,
        ];
    }

    /**
     * Check whether all seats in a reservation are still actively locked in Redis
     * by the given booking_code.
     *
     * @param  array<int, string>  $seatCodes
     */
    public function verifyLocksOwnedBy(int $showtimeId, array $seatCodes, string $bookingCode): bool
    {
        foreach ($seatCodes as $seatCode) {
            $lock = Cache::get($this->seatKey($showtimeId, $seatCode));

            if (! is_array($lock) || ($lock['booking_code'] ?? null) !== $bookingCode) {
                return false;
            }
        }

        return true;
    }

    /**
     * Release the temporary Redis locks for the given seats.
     *
     * @param  array<int, string>  $seatCodes
     */
    public function releaseSeats(int $showtimeId, array $seatCodes, ?string $bookingCode = null): void
    {
        $normalizedToRemove = [];

        foreach ($seatCodes as $seatCode) {
            $normalized = strtoupper(trim($seatCode));
            $key = $this->seatKey($showtimeId, $normalized);

            if ($bookingCode !== null) {
                $current = Cache::get($key);
                if (is_array($current) && ($current['booking_code'] ?? null) !== $bookingCode) {
                    continue;
                }
            }

            Cache::forget($key);
            $normalizedToRemove[] = $normalized;
        }

        $indexKey = $this->showtimeIndexKey($showtimeId);
        $indexed = Cache::get($indexKey, []);
        if (is_array($indexed) && $normalizedToRemove !== []) {
            $remaining = array_values(array_diff($indexed, $normalizedToRemove));
            if ($remaining === []) {
                Cache::forget($indexKey);
            } else {
                Cache::put($indexKey, $remaining, (int) config('booking.seat_lock_ttl_seconds', 600));
            }
        }
    }

    /**
     * Return all currently active temporary Redis locks for a showtime.
     *
     * @return array<int, array{seat_code: string, booking_code: string, user_id: int, locked_at: string, expires_at: string}>
     */
    public function getActiveLocksForShowtime(int $showtimeId): array
    {
        $indexKey = $this->showtimeIndexKey($showtimeId);
        $indexedSeats = Cache::get($indexKey, []);

        if (! is_array($indexedSeats) || $indexedSeats === []) {
            return [];
        }

        $activeLocks = [];
        $stillAliveSeats = [];

        foreach ($indexedSeats as $seatCode) {
            $lock = Cache::get($this->seatKey($showtimeId, (string) $seatCode));
            if (is_array($lock)) {
                $activeLocks[] = $lock;
                $stillAliveSeats[] = (string) $seatCode;
            }
        }

        if (count($stillAliveSeats) !== count($indexedSeats)) {
            if ($stillAliveSeats === []) {
                Cache::forget($indexKey);
            } else {
                Cache::put($indexKey, $stillAliveSeats, (int) config('booking.seat_lock_ttl_seconds', 600));
            }
        }

        return $activeLocks;
    }

    /**
     * @param  array<int, string>  $seatCodes
     */
    private function registerSeatsInShowtimeIndex(int $showtimeId, array $seatCodes, int $ttl): void
    {
        $indexKey = $this->showtimeIndexKey($showtimeId);
        $existing = Cache::get($indexKey, []);
        $existing = is_array($existing) ? $existing : [];

        $merged = array_values(array_unique(array_merge($existing, $seatCodes)));
        Cache::put($indexKey, $merged, $ttl + 60);
    }
}

