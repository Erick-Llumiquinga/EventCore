<?php

namespace Tests\Feature;

use Tests\TestCase;

class EndpointNotFoundTest extends TestCase
{
    public function test_unknown_api_route_returns_the_endpoint_not_found_contract(): void
    {
        $this->getJson('/api/auto')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado')
            ->assertJsonPath('data', null);
    }

    public function test_unknown_web_route_returns_the_endpoint_not_found_contract(): void
    {
        $this->get('/auto')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado')
            ->assertJsonPath('data', null);
    }
}
