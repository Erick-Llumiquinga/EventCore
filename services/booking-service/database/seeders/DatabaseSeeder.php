<?php

namespace Database\Seeders;

use App\Models\Reservation;
use App\Models\ReservationSeat;
use App\Services\NotificationService;
use App\Services\QrCodeService;
use App\Services\SeatLockService;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed sample reservations:
     * 1. EC-784523 (confirmed, with QR ready)
     * 2. EC-AB12CD (pending, with seats A1 & A2 locked in Redis ready to confirm)
     */
    public function run(): void
    {
        $qrService = app(QrCodeService::class);
        $notificationService = app(NotificationService::class);
        $seatLockService = app(SeatLockService::class);

        // 1. Confirmed reservation (EC-784523)
        $reservation = Reservation::create([
            'booking_code' => 'EC-784523',
            'user_id' => 1,
            'user_name' => 'Super Admin',
            'user_email' => 'admin@eventcore.com',
            'showtime_id' => 1,
            'movie_title' => 'Abyssal — Terror submarino',
            'cinema_name' => 'Cine Multicentro Quito',
            'auditorium_name' => 'Sala 1 — 2D',
            'showtime_start' => now()->addDay()->setTime(19, 30),
            'total_tickets' => 2,
            'total_amount' => 22.80,
            'status' => Reservation::STATUS_CONFIRMED,
            'payment_method' => 'card',
            'payment_reference' => 'PAY-SEED0001',
            'expires_at' => now()->addMinutes(10),
            'confirmed_at' => now(),
        ]);

        $seats = ['A3', 'A4'];
        foreach ($seats as $seatCode) {
            $parsed = ReservationSeat::parseSeatCode($seatCode);
            $reservation->seats()->create([
                'showtime_id' => 1,
                'seat_code' => $parsed['seat_code'],
                'row_label' => $parsed['row_label'],
                'seat_number' => $parsed['seat_number'],
                'status' => ReservationSeat::STATUS_CONFIRMED,
            ]);
        }

        $reservation->tickets()->createMany([
            [
                'ticket_type' => 'General',
                'quantity' => 1,
                'unit_price' => 15.20,
                'subtotal' => 15.20,
            ],
            [
                'ticket_type' => '3ra Edad',
                'quantity' => 1,
                'unit_price' => 7.60,
                'subtotal' => 7.60,
            ],
        ]);

        $qrData = $qrService->generateForReservation($reservation, $seats);
        $reservation->update([
            'qr_payload' => $qrData['payload'],
            'qr_svg' => $qrData['svg'],
        ]);

        $notificationService->recordEvent(
            $reservation,
            'seats_locked_redis',
            'Asientos bloqueados temporalmente en Redis por 10 minutos',
            ['seats' => $seats, 'ttl_seconds' => 600]
        );
        $notificationService->recordEvent(
            $reservation,
            'payment_confirmed',
            'Pago confirmado y asientos asignados definitivamente',
            ['payment_reference' => 'PAY-SEED0001', 'total_amount' => 22.80]
        );
        $notificationService->recordEvent(
            $reservation,
            'qr_generated',
            'Código QR digital firmado generado exitosamente',
            ['booking_code' => $reservation->booking_code]
        );

        // 2. Pending reservation (EC-AB12CD) ready to be confirmed in Postman
        $pendingSeats = ['A1', 'A2'];
        $lockResult = $seatLockService->acquireSeats(1, $pendingSeats, 'EC-AB12CD', 1, 3600);

        $pending = Reservation::create([
            'booking_code' => 'EC-AB12CD',
            'user_id' => 1,
            'user_name' => 'Super Admin',
            'user_email' => 'admin@eventcore.com',
            'showtime_id' => 1,
            'movie_title' => 'Abyssal — Terror submarino',
            'cinema_name' => 'Cine Multicentro Quito',
            'auditorium_name' => 'Sala 1 — 2D',
            'showtime_start' => now()->addDay()->setTime(19, 30),
            'total_tickets' => 2,
            'total_amount' => 30.00,
            'status' => Reservation::STATUS_PENDING,
            'expires_at' => $lockResult['expires_at'],
        ]);

        foreach ($pendingSeats as $seatCode) {
            $parsed = ReservationSeat::parseSeatCode($seatCode);
            $pending->seats()->create([
                'showtime_id' => 1,
                'seat_code' => $parsed['seat_code'],
                'row_label' => $parsed['row_label'],
                'seat_number' => $parsed['seat_number'],
                'status' => ReservationSeat::STATUS_LOCKED,
            ]);
        }

        $pending->tickets()->create([
            'ticket_type' => 'Adulto',
            'quantity' => 2,
            'unit_price' => 15.00,
            'subtotal' => 30.00,
        ]);

        $notificationService->recordEvent(
            $pending,
            'seats_locked_redis',
            'Asientos bloqueados temporalmente en Redis por 10 minutos',
            ['seats' => $pendingSeats, 'ttl_seconds' => 3600]
        );
    }
}
