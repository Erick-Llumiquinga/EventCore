<?php

namespace Tests\Feature;

use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class BookingApiTest extends TestCase
{
    use MakesJwtTokens;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_requires_jwt_token_on_protected_routes(): void
    {
        $this->getJson('/api/showtimes/1/seats')
            ->assertStatus(401)
            ->assertJsonPath('code', 500);

        $this->postJson('/api/reservations', [])
            ->assertStatus(401)
            ->assertJsonPath('code', 500);
    }

    public function test_creates_pending_reservation_and_locks_seats_in_redis_for_10_minutes(): void
    {
        $token = $this->attendeeToken();

        $response = $this->withToken($token)->postJson('/api/reservations', [
            'showtime_id' => 1,
            'seats' => ['B1', 'B2'],
            'adult_tickets' => 1,
            'discount_tickets' => 1,
            'unit_price' => 15.00,
            'movie_title' => 'Horizontes',
            'cinema_name' => 'Cine Multicentro Quito',
            'auditorium_name' => 'Sala 1',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.status', Reservation::STATUS_PENDING)
            ->assertJsonPath('data.showtime_id', 1)
            ->assertJsonPath('data.seats', ['B1', 'B2'])
            ->assertJsonPath('data.total_tickets', 2)
            ->assertJsonPath('data.total_amount', 22.5);

        $bookingCode = $response->json('data.booking_code');
        $this->assertStringStartsWith('EC-', $bookingCode);

        // Seat availability reflects the temporary Redis lock
        $availability = $this->withToken($token)->getJson('/api/showtimes/1/seats');
        $availability->assertStatus(200)
            ->assertJsonPath('data.locked_seats', ['B1', 'B2'])
            ->assertJsonPath('data.occupied_seats', ['B1', 'B2']);
    }

    public function test_prevents_overselling_when_second_user_requests_locked_seat_and_rolls_back_partial_locks(): void
    {
        $user1Token = $this->makeToken(['role' => 'client', 'name' => 'User One', 'email' => 'u1@test.com'], 10);
        $user2Token = $this->makeToken(['role' => 'client', 'name' => 'User Two', 'email' => 'u2@test.com'], 20);

        // User 1 locks B2
        $this->withToken($user1Token)->postJson('/api/reservations', [
            'showtime_id' => 1,
            'seats' => ['B2'],
        ])->assertStatus(201);

        // User 2 requests B1 and B2 together -> must fail with 409 and roll back B1!
        $conflict = $this->withToken($user2Token)->postJson('/api/reservations', [
            'showtime_id' => 1,
            'seats' => ['B1', 'B2'],
        ]);

        $conflict->assertStatus(409)
            ->assertJsonPath('code', 500);

        // Verify B1 was rolled back and is free for User 2 to book alone
        $this->withToken($user2Token)->postJson('/api/reservations', [
            'showtime_id' => 1,
            'seats' => ['B1'],
        ])->assertStatus(201);
    }

    public function test_confirms_reservation_generates_signed_qr_and_verifies_qr(): void
    {
        $token = $this->attendeeToken();

        $created = $this->withToken($token)->postJson('/api/reservations', [
            'showtime_id' => 2,
            'seats' => ['C3', 'C4'],
            'movie_title' => 'Abyssal',
        ])->assertStatus(201);

        $code = $created->json('data.booking_code');

        // Confirm payment
        $confirmed = $this->withToken($token)->postJson("/api/reservations/{$code}/confirm", [
            'payment_method' => 'card',
            'card_holder' => 'Juan Pérez',
            'card_last_four' => '3456',
        ]);

        $confirmed->assertStatus(200)
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.status', Reservation::STATUS_CONFIRMED);

        $this->assertNotEmpty($confirmed->json('data.qr_svg'));
        $this->assertStringStartsWith('data:image/svg+xml;base64,', (string) $confirmed->json('data.qr_svg_data_uri'));

        // Fetch QR endpoint
        $qrResponse = $this->withToken($token)->getJson("/api/reservations/{$code}/qr");
        $qrResponse->assertStatus(200)
            ->assertJsonPath('data.booking_code', $code);

        $rawPayload = $qrResponse->json('data.qr_payload_raw');

        // Verify QR signature
        $this->withToken($token)->postJson('/api/qr/verify', [
            'qr_payload' => $rawPayload,
        ])->assertStatus(200)
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.booking_code', $code);

        // Tampered QR payload must be rejected
        $this->withToken($token)->postJson('/api/qr/verify', [
            'qr_payload' => str_replace($code, 'EC-000000', $rawPayload),
        ])->assertStatus(422)
            ->assertJsonPath('code', 500);

        // Seats are now in confirmed_seats (permanent DB) and temporary Redis lock was cleaned up
        $availability = $this->withToken($token)->getJson('/api/showtimes/2/seats');
        $availability->assertStatus(200)
            ->assertJsonPath('data.confirmed_seats', ['C3', 'C4'])
            ->assertJsonPath('data.locked_seats', []);
    }

    public function test_cancelling_reservation_releases_redis_locks_immediately(): void
    {
        $user1Token = $this->makeToken(['role' => 'client', 'name' => 'U1', 'email' => 'u1@test.com'], 11);
        $user2Token = $this->makeToken(['role' => 'client', 'name' => 'U2', 'email' => 'u2@test.com'], 22);

        $res = $this->withToken($user1Token)->postJson('/api/reservations', [
            'showtime_id' => 3,
            'seats' => ['D5'],
        ])->assertStatus(201);

        $code = $res->json('data.booking_code');

        // Cancel reservation
        $this->withToken($user1Token)->postJson("/api/reservations/{$code}/cancel")
            ->assertStatus(200)
            ->assertJsonPath('data.status', Reservation::STATUS_CANCELLED);

        // User 2 can immediately reserve D5 without waiting 10 minutes
        $this->withToken($user2Token)->postJson('/api/reservations', [
            'showtime_id' => 3,
            'seats' => ['D5'],
        ])->assertStatus(201);
    }

    public function test_expired_reservation_cannot_be_confirmed_and_releases_seats(): void
    {
        $token = $this->attendeeToken();

        $res = $this->withToken($token)->postJson('/api/reservations', [
            'showtime_id' => 4,
            'seats' => ['E1'],
        ])->assertStatus(201);

        $code = $res->json('data.booking_code');

        // Simulate 11 minutes passing (> 10 min lock window)
        $this->travel(11)->minutes();

        $this->withToken($token)->postJson("/api/reservations/{$code}/confirm")
            ->assertStatus(409)
            ->assertJsonPath('code', 500);

        $this->withToken($token)->getJson("/api/reservations/{$code}/tracking")
            ->assertStatus(200)
            ->assertJsonPath('data.status', Reservation::STATUS_EXPIRED);
    }

    public function test_admin_can_list_all_reservations_with_summary_metrics(): void
    {
        $attendeeToken = $this->attendeeToken();
        $adminToken = $this->adminToken();

        $this->withToken($attendeeToken)->postJson('/api/reservations', [
            'showtime_id' => 1,
            'seats' => ['F1'],
        ])->assertStatus(201);

        // Attendee is forbidden on admin route
        $this->withToken($attendeeToken)->getJson('/api/admin/reservations')
            ->assertStatus(403);

        // Admin gets full list and summary
        $this->withToken($adminToken)->getJson('/api/admin/reservations')
            ->assertStatus(200)
            ->assertJsonPath('data.summary.total_pending_locks', 1);
    }
}

