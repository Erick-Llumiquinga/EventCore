<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_is_public_and_reports_booking_service(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.service', 'booking-service')
            ->assertJsonPath('data.database', 'ok')
            ->assertJsonPath('data.seat_lock_ttl_seconds', 600);
    }
}

