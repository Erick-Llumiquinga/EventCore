<?php

namespace Tests\Feature;

use App\Models\Cinema;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class AdminCinemaApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_store_requires_a_token(): void
    {
        $this->postJson('/api/cinemas', $this->validPayload())
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_store_forbids_non_admin_roles(): void
    {
        $this->withToken($this->attendeeToken())
            ->postJson('/api/cinemas', $this->validPayload())
            ->assertForbidden()
            ->assertJsonPath('code', 500);
    }

    public function test_store_validates_the_payload(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/cinemas', ['name' => ''])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['name', 'address', 'city']]);
    }

    public function test_admin_can_create_a_cinema(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/cinemas', $this->validPayload())
            ->assertCreated()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.name', 'Cine Megaplex')
            ->assertJsonPath('data.city', 'Cochabamba')
            ->assertJsonPath('data.created_by', 1)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('cinemas', ['name' => 'Cine Megaplex', 'city' => 'Cochabamba', 'created_by' => 1, 'updated_by' => 1]);
    }

    public function test_admin_can_update_a_cinema(): void
    {
        $cinema = Cinema::first();

        $this->withToken($this->adminToken())
            ->putJson('/api/cinemas/'.$cinema->id, ['name' => 'Cine Renombrado'])
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.name', 'Cine Renombrado')
            ->assertJsonPath('data.created_by', null)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('cinemas', ['id' => $cinema->id, 'name' => 'Cine Renombrado', 'updated_by' => 1]);
    }

    public function test_update_returns_404_for_unknown_cinema(): void
    {
        $this->withToken($this->adminToken())
            ->putJson('/api/cinemas/999999', ['name' => 'x'])
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_admin_can_soft_delete_an_empty_cinema(): void
    {
        $cinema = Cinema::create(['name' => 'Cine Vacío', 'address' => 'Calle 1', 'city' => 'Sucre']);

        $this->withToken($this->adminToken())
            ->deleteJson('/api/cinemas/'.$cinema->id)
            ->assertOk()
            ->assertJsonPath('code', 200);

        $this->assertSoftDeleted('cinemas', ['id' => $cinema->id]);

        $this->withToken($this->adminToken())
            ->getJson('/api/cinemas/'.$cinema->id)
            ->assertNotFound();
    }

    public function test_delete_is_refused_while_the_cinema_has_auditoriums(): void
    {
        $cinema = Cinema::first();

        $this->withToken($this->adminToken())
            ->deleteJson('/api/cinemas/'.$cinema->id)
            ->assertStatus(409)
            ->assertJsonPath('code', 500);

        $this->assertNull($cinema->fresh()->deleted_at);
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'name' => 'Cine Megaplex',
            'address' => 'Av. Circunvalación 890',
            'city' => 'Cochabamba',
        ];
    }
}
