<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_is_public_and_returns_api_contract(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.service', 'catalog-service')
            ->assertJsonPath('data.database', 'ok')
            ->assertJsonStructure(['code', 'message', 'data']);
    }
}
