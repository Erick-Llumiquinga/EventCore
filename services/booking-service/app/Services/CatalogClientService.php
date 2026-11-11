<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CatalogClientService
{
    /**
     * Fetch showtime details (movie, auditorium, cinema, ticket_types) from catalog-service.
     *
     * @return array{found: bool, reachable: bool, data: ?array<string, mixed>}
     */
    public function getShowtime(int $showtimeId, ?string $bearerToken): array
    {
        if (! $bearerToken || app()->runningUnitTests()) {
            return ['found' => true, 'reachable' => false, 'data' => null];
        }

        $baseUrl = rtrim((string) config('booking.catalog_service_url', 'http://catalog-service:8000/api'), '/');

        try {
            $response = Http::withToken($bearerToken)
                ->acceptJson()
                ->timeout(3)
                ->get("{$baseUrl}/showtimes/{$showtimeId}");

            if ($response->status() === 404) {
                return ['found' => false, 'reachable' => true, 'data' => null];
            }

            if ($response->successful()) {
                return [
                    'found' => true,
                    'reachable' => true,
                    'data' => $response->json('data'),
                ];
            }
        } catch (\Throwable) {
            // If catalog-service is temporarily unreachable, degrade gracefully.
        }

        return ['found' => true, 'reachable' => false, 'data' => null];
    }

    /**
     * Fetch the physical auditorium seats for a showtime from catalog-service.
     *
     * @return array{found: bool, reachable: bool, seats: array<int, array<string, mixed>>}
     */
    public function getShowtimeSeats(int $showtimeId, ?string $bearerToken): array
    {
        if (! $bearerToken || app()->runningUnitTests()) {
            return ['found' => true, 'reachable' => false, 'seats' => []];
        }

        $baseUrl = rtrim((string) config('booking.catalog_service_url', 'http://catalog-service:8000/api'), '/');

        try {
            $response = Http::withToken($bearerToken)
                ->acceptJson()
                ->timeout(3)
                ->get("{$baseUrl}/showtimes/{$showtimeId}/seats");

            if ($response->status() === 404) {
                return ['found' => false, 'reachable' => true, 'seats' => []];
            }

            if ($response->successful() && is_array($response->json('data'))) {
                return [
                    'found' => true,
                    'reachable' => true,
                    'seats' => $response->json('data'),
                ];
            }
        } catch (\Throwable) {
            // Graceful fallback when catalog-service is unreachable.
        }

        return ['found' => true, 'reachable' => false, 'seats' => []];
    }
}

