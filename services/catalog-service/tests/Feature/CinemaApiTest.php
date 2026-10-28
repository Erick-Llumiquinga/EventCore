<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class CinemaApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_cinemas_requires_a_bearer_token(): void
    {
        $this->getJson('/api/cinemas')
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_cinemas_returns_paginated_list_with_defaults(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/cinemas')
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonStructure(['code', 'message', 'data' => ['cinemas', 'pagination' => ['total', 'per_page', 'current_page', 'last_page']]])
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonPath('data.pagination.current_page', 1)
            ->assertJsonPath('data.pagination.per_page', 15);
    }

    public function test_cinemas_filters_by_city(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/cinemas?city=quito')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.cinemas.0.name', 'Cine Multicentro Quito');

        $this->withToken($this->adminToken())
            ->getJson('/api/cinemas?city=Cochabamba')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 0);
    }

    public function test_show_returns_cinema_with_auditoriums(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/cinemas/1')
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.name', 'Cine Multicentro Quito')
            ->assertJsonCount(2, 'data.auditoriums')
            ->assertJsonStructure(['data' => ['auditoriums' => [['id', 'cinema_id', 'name', 'capacity']]]]);
    }

    public function test_show_returns_404_for_unknown_cinema(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/cinemas/999999')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }
}
