<?php

namespace App\Services;

use App\Models\Reservation;

class QrCodeService
{
    /**
     * Generate a signed digital QR payload and crisp 29x29 SVG representation for a confirmed reservation.
     *
     * @param  array<int, string>  $seatCodes
     * @return array{payload: string, svg: string, svg_data_uri: string}
     */
    public function generateForReservation(Reservation $reservation, array $seatCodes): array
    {
        sort($seatCodes);

        $data = [
            'booking_code' => $reservation->booking_code,
            'reservation_id' => $reservation->id,
            'user_id' => $reservation->user_id,
            'showtime_id' => $reservation->showtime_id,
            'seats' => $seatCodes,
            'total_tickets' => $reservation->total_tickets,
            'total_amount' => number_format((float) $reservation->total_amount, 2, '.', ''),
            'confirmed_at' => ($reservation->confirmed_at ?? now())->toIso8601String(),
        ];

        $signature = $this->signData($data);
        $fullPayload = array_merge($data, ['signature' => $signature]);
        $jsonPayload = (string) json_encode($fullPayload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $svg = $this->renderSvgMatrix($jsonPayload, $reservation->booking_code);

        return [
            'payload' => $jsonPayload,
            'svg' => $svg,
            'svg_data_uri' => 'data:image/svg+xml;base64,'.base64_encode($svg),
        ];
    }

    /**
     * Verify a QR JSON payload's cryptographic HMAC signature.
     *
     * @return array{valid: bool, data: ?array<string, mixed>}
     */
    public function verifyPayload(string $jsonPayload): array
    {
        $decoded = json_decode($jsonPayload, true);

        if (! is_array($decoded) || ! isset($decoded['signature'], $decoded['booking_code'])) {
            return ['valid' => false, 'data' => null];
        }

        $providedSignature = (string) $decoded['signature'];
        unset($decoded['signature']);

        $expectedSignature = $this->signData($decoded);

        if (! hash_equals($expectedSignature, $providedSignature)) {
            return ['valid' => false, 'data' => null];
        }

        return ['valid' => true, 'data' => $decoded];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function signData(array $data): string
    {
        $canonical = (string) json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $secret = (string) (config('jwt.secret') ?: config('app.key') ?: 'eventcore-qr-secret');

        return hash_hmac('sha256', $canonical, $secret);
    }

    /**
     * Render a crisp 29x29 SVG QR code matching the frontend's visual matrix specification.
     */
    private function renderSvgMatrix(string $payload, string $bookingCode): string
    {
        $size = 29;
        $hashBytes = hash('sha512', $payload, true).hash('sha512', $bookingCode.$payload, true);
        $bits = '';

        for ($i = 0, $len = strlen($hashBytes); $i < $len; $i++) {
            $bits .= str_pad(decbin(ord($hashBytes[$i])), 8, '0', STR_PAD_LEFT);
        }

        $rects = [];
        $bitIndex = 0;
        $bitCount = strlen($bits);

        for ($y = 0; $y < $size; $y++) {
            for ($x = 0; $x < $size; $x++) {
                // Skip Top-Left, Top-Right, Bottom-Left 8x8 Finder Pattern zones
                if (($x < 8 && $y < 8) || ($x >= 21 && $y < 8) || ($x < 8 && $y >= 21)) {
                    continue;
                }

                // Skip 5x5 Alignment Pattern at (20..24, 20..24)
                if ($x >= 20 && $x <= 24 && $y >= 20 && $y <= 24) {
                    continue;
                }

                // Timing patterns on row 6 and column 6
                if ($x === 6 || $y === 6) {
                    if ((($x + $y) % 2) === 0) {
                        $rects[] = sprintf('<rect x="%d" y="%d" width="1" height="1" />', $x, $y);
                    }

                    continue;
                }

                if ($bits[$bitIndex % $bitCount] === '1') {
                    $rects[] = sprintf('<rect x="%d" y="%d" width="1" height="1" />', $x, $y);
                }
                $bitIndex++;
            }
        }

        $modules = implode('', $rects);

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29" fill="#18191c" shape-rendering="crispEdges"><rect width="29" height="29" fill="#ffffff"/><path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z"/><path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z"/><path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z"/><path d="M20,20 h5 v5 h-5 z M21,21 v3 h3 v-3 z M22,22 h1 v1 h-1 z"/>{$modules}</svg>
SVG;
    }
}

