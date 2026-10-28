<?php

namespace Tests\Feature;

use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class MovieApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_movies_requires_a_bearer_token(): void
    {
        $this->getJson('/api/movies')
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_movies_rejects_a_garbage_token(): void
    {
        $this->withToken('not.a.valid.token')
            ->getJson('/api/movies')
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_movies_rejects_a_blacklisted_token(): void
    {
        $token = $this->adminToken();

        // Simulate a logout on auth-service: the token jti goes to the shared cache blacklist.
        app('tymon.jwt.auth')->setToken($token)->invalidate();

        $this->withToken($token)
            ->getJson('/api/movies')
            ->assertUnauthorized()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Token revocado (sesión cerrada)');
    }

    public function test_movies_returns_paginated_list_with_defaults(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/movies')
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonStructure(['code', 'message', 'data' => ['current_page', 'data', 'total', 'per_page']])
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.current_page', 1)
            ->assertJsonPath('data.per_page', 15);
    }

    public function test_movies_filters_by_status(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/movies?status=published')
            ->assertOk()
            ->assertJsonPath('data.total', 3);

        $this->withToken($this->adminToken())
            ->getJson('/api/movies?status=draft')
            ->assertOk()
            ->assertJsonPath('data.total', 0);
    }

    public function test_movies_filters_by_cinema_through_showtimes(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/movies?cinema_id=1')
            ->assertOk()
            ->assertJsonPath('data.total', 3);

        $this->withToken($this->adminToken())
            ->getJson('/api/movies?cinema_id=999999')
            ->assertStatus(422)
            ->assertJsonPath('code', 500);
    }

    public function test_movies_paginates_with_per_page(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/movies?per_page=2')
            ->assertOk()
            ->assertJsonPath('data.per_page', 2)
            ->assertJsonPath('data.total', 3)
            ->assertJsonCount(2, 'data.data');
    }

    public function test_movie_detail_returns_showtimes_with_relations(): void
    {
        $movie = Movie::where('title', 'like', 'Galaxias%')->first();

        $this->withToken($this->adminToken())
            ->getJson('/api/movies/'.$movie->id)
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.id', $movie->id)
            ->assertJsonPath('data.duration_minutes', 128)
            ->assertJsonStructure([
                'data' => [
                    'title', 'description', 'duration_minutes', 'rating', 'poster_url', 'status',
                    'showtimes' => [[
                        'id', 'start_time', 'format',
                        'auditorium' => ['id', 'name', 'cinema' => ['id', 'name']],
                        'ticket_types' => [['id', 'name', 'price']],
                    ]],
                ],
            ]);
    }

    public function test_movie_returns_404_for_unknown_movie(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/movies/00000000-0000-4000-8000-000000000000')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_movie_returns_404_for_malformed_uuid(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/movies/not-a-uuid')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }
}
