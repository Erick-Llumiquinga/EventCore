<?php

namespace Tests\Feature;

use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class AdminMovieApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_store_requires_a_token(): void
    {
        $this->postJson('/api/movies', $this->validPayload())
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_store_forbids_non_admin_roles(): void
    {
        $this->withToken($this->attendeeToken())
            ->postJson('/api/movies', $this->validPayload())
            ->assertForbidden()
            ->assertJsonPath('code', 500);
    }

    public function test_store_validates_the_payload(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/movies', ['title' => ''])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Errores de validación')
            ->assertJsonStructure(['code', 'message', 'errors' => ['title', 'description', 'duration_minutes', 'rating']]);
    }

    public function test_admin_can_create_a_movie(): void
    {
        $response = $this->withToken($this->adminToken())
            ->postJson('/api/movies', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.title', 'Maravillas del Cine')
            ->assertJsonPath('data.duration_minutes', 105)
            ->assertJsonPath('data.rating', '+12')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.created_by', 1)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('movies', ['title' => 'Maravillas del Cine', 'status' => 'draft', 'created_by' => 1, 'updated_by' => 1]);
    }

    public function test_admin_can_update_a_movie(): void
    {
        $movie = Movie::first();

        $this->withToken($this->adminToken())
            ->putJson('/api/movies/'.$movie->id, ['title' => 'Título actualizado', 'duration_minutes' => 130, 'status' => 'finished'])
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.title', 'Título actualizado')
            ->assertJsonPath('data.duration_minutes', 130)
            ->assertJsonPath('data.status', 'finished')
            ->assertJsonPath('data.created_by', null)
            ->assertJsonPath('data.updated_by', 1);
    }

    public function test_update_returns_404_for_unknown_movie(): void
    {
        $this->withToken($this->adminToken())
            ->putJson('/api/movies/00000000-0000-4000-8000-000000000000', ['title' => 'x'])
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_admin_can_soft_delete_a_movie(): void
    {
        $movie = Movie::first();

        $this->withToken($this->adminToken())
            ->deleteJson('/api/movies/'.$movie->id)
            ->assertOk()
            ->assertJsonPath('code', 200);

        $this->assertSoftDeleted('movies', ['id' => $movie->id]);

        $this->withToken($this->adminToken())
            ->getJson('/api/movies/'.$movie->id)
            ->assertNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'title' => 'Maravillas del Cine',
            'description' => 'Película de prueba creada en los tests del catálogo.',
            'duration_minutes' => 105,
            'rating' => '+12',
            'poster_url' => 'https://example.com/poster.png',
            'status' => 'draft',
        ];
    }
}
