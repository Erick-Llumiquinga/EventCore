<?php

namespace Tests\Feature;

use App\Models\Auditorium;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class AdminAuditoriumApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_store_requires_a_token(): void
    {
        $this->postJson('/api/auditoriums', ['cinema_id' => 1, 'name' => 'Sala X', 'capacity' => 100])
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_store_forbids_non_admin_roles(): void
    {
        $this->withToken($this->attendeeToken())
            ->postJson('/api/auditoriums', ['cinema_id' => 1, 'name' => 'Sala X', 'capacity' => 100])
            ->assertForbidden()
            ->assertJsonPath('code', 500);
    }

    public function test_store_validates_the_payload(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/auditoriums', ['name' => ''])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['cinema_id', 'name', 'capacity']]);
    }

    public function test_store_rejects_an_unknown_cinema(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/auditoriums', ['cinema_id' => 999999, 'name' => 'Sala X', 'capacity' => 100])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['cinema_id']]);
    }

    public function test_admin_can_create_an_auditorium(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/auditoriums', ['cinema_id' => 1, 'name' => 'Sala IMAX', 'capacity' => 200])
            ->assertCreated()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.name', 'Sala IMAX')
            ->assertJsonPath('data.capacity', 200)
            ->assertJsonPath('data.cinema_id', 1);

        $this->assertDatabaseHas('auditoriums', ['cinema_id' => 1, 'name' => 'Sala IMAX']);
    }

    public function test_admin_can_update_an_auditorium(): void
    {
        $auditorium = Auditorium::first();

        $this->withToken($this->adminToken())
            ->putJson('/api/auditoriums/'.$auditorium->id, ['capacity' => 300])
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.capacity', 300);

        $this->assertDatabaseHas('auditoriums', ['id' => $auditorium->id, 'capacity' => 300]);
    }

    public function test_update_returns_404_for_unknown_auditorium(): void
    {
        $this->withToken($this->adminToken())
            ->putJson('/api/auditoriums/999999', ['capacity' => 10])
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_admin_can_delete_an_empty_auditorium(): void
    {
        $auditorium = Auditorium::create(['cinema_id' => 2, 'name' => 'Sala Temporal', 'capacity' => 50]);

        $this->withToken($this->adminToken())
            ->deleteJson('/api/auditoriums/'.$auditorium->id)
            ->assertOk()
            ->assertJsonPath('code', 200);

        $this->assertDatabaseMissing('auditoriums', ['id' => $auditorium->id]);
    }

    public function test_delete_is_refused_while_the_auditorium_has_showtimes(): void
    {
        // Seeded auditorium 1 has showtimes.
        $this->withToken($this->adminToken())
            ->deleteJson('/api/auditoriums/1')
            ->assertStatus(409)
            ->assertJsonPath('code', 500);

        $this->assertNotNull(Auditorium::find(1));
    }
}
