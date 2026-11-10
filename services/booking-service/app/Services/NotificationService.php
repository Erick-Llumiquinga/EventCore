<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\ReservationTracking;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Record a tracking milestone for the reservation and dispatch simulated/email notification.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function recordEvent(
        Reservation $reservation,
        string $event,
        string $description,
        array $metadata = [],
    ): ReservationTracking {
        $tracking = $reservation->trackings()->create([
            'event' => $event,
            'status' => $reservation->status,
            'description' => $description,
            'metadata' => $metadata,
        ]);

        Log::info("[EventCore Booking Tracking] {$reservation->booking_code} -> {$event}", [
            'booking_code' => $reservation->booking_code,
            'user_id' => $reservation->user_id,
            'user_email' => $reservation->user_email,
            'status' => $reservation->status,
            'description' => $description,
            'metadata' => $metadata,
        ]);

        return $tracking;
    }

    /**
     * Send a confirmation notification (via configured Mailer / Mailtrap / log) when payment completes.
     *
     * @param  array<int, string>  $seatCodes
     */
    public function sendConfirmationNotification(Reservation $reservation, array $seatCodes): void
    {
        $seatsText = implode(', ', $seatCodes);
        $recipient = $reservation->user_email ?: 'cliente@eventcore.com';

        try {
            Mail::raw(
                "¡Hola {$reservation->user_name}!\n\n".
                "Tu reserva en EventCore ha sido confirmada exitosamente.\n".
                "Código de reserva: {$reservation->booking_code}\n".
                "Película: ".($reservation->movie_title ?: 'Función EventCore')."\n".
                "Cine / Sala: ".($reservation->cinema_name ?: 'EventCore').' - '.($reservation->auditorium_name ?: 'Sala Principal')."\n".
                "Asientos: {$seatsText}\n".
                "Total pagado: $".number_format((float) $reservation->total_amount, 2)."\n\n".
                "Presenta tu código QR digital en la entrada de la sala.",
                function ($message) use ($recipient, $reservation): void {
                    $message->to($recipient)
                        ->subject("Confirmación de Reserva {$reservation->booking_code} - EventCore");
                }
            );

            $this->recordEvent(
                $reservation,
                'notification_sent',
                "Notificación de confirmación enviada a {$recipient}",
                ['channel' => config('mail.default', 'log'), 'recipient' => $recipient, 'seats' => $seatCodes]
            );
        } catch (\Throwable $e) {
            $this->recordEvent(
                $reservation,
                'notification_simulated',
                "Notificación registrada en log para {$recipient}",
                ['channel' => 'log', 'recipient' => $recipient, 'error' => $e->getMessage()]
            );
        }
    }
}

