<?php

namespace Tests\Feature;

use App\Models\Movie;
use App\Models\Seat;
use App\Models\Showtime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class AdminShowtimeApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_store_requires_a_token(): void
    {
        $this->postJson('/api/showtimes', $this->validShowtimePayload())
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_store_forbids_non_admin_roles(): void
    {
        $this->withToken($this->attendeeToken())
            ->postJson('/api/showtimes', $this->validShowtimePayload())
            ->assertForbidden()
            ->assertJsonPath('code', 500);
    }

    public function test_store_validates_the_payload(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/showtimes', ['format' => ''])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['movie_id', 'auditorium_id', 'start_time', 'format']]);
    }

    public function test_admin_can_create_a_showtime(): void
    {
        $movie = Movie::first();

        $this->withToken($this->adminToken())
            ->postJson('/api/showtimes', $this->validShowtimePayload())
            ->assertCreated()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.movie_id', $movie->id)
            ->assertJsonPath('data.auditorium_id', 2)
            ->assertJsonPath('data.format', '2D')
            ->assertJsonPath('data.created_by', 1)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('showtimes', ['movie_id' => $movie->id, 'auditorium_id' => 2, 'format' => '2D', 'created_by' => 1, 'updated_by' => 1]);
    }

    public function test_admin_can_update_a_showtime(): void
    {
        $this->withToken($this->adminToken())
            ->putJson('/api/showtimes/1', ['format' => 'IMAX-Sub'])
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.format', 'IMAX-Sub')
            ->assertJsonPath('data.created_by', null)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('showtimes', ['id' => 1, 'format' => 'IMAX-Sub', 'updated_by' => 1]);
    }

    public function test_update_returns_404_for_unknown_showtime(): void
    {
        $this->withToken($this->adminToken())
            ->putJson('/api/showtimes/999999', ['format' => '2D'])
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_admin_can_delete_a_showtime(): void
    {
        $showtime = Showtime::create([
            'movie_id' => Movie::first()->id,
            'auditorium_id' => 2,
            'start_time' => now()->addDays(30)->setTime(12, 0),
            'format' => '2D',
        ]);

        $this->withToken($this->adminToken())
            ->deleteJson('/api/showtimes/'.$showtime->id)
            ->assertOk()
            ->assertJsonPath('code', 200);

        $this->assertDatabaseMissing('showtimes', ['id' => $showtime->id]);
    }

    public function test_admin_can_create_a_ticket_type(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/ticket-types', ['showtime_id' => 1, 'name' => 'Niños', 'price' => 10.00])
            ->assertCreated()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.name', 'Niños')
            ->assertJsonPath('data.price', '10.00')
            ->assertJsonPath('data.created_by', 1)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('ticket_types', ['showtime_id' => 1, 'name' => 'Niños', 'created_by' => 1, 'updated_by' => 1]);
    }

    public function test_ticket_type_store_validates_the_payload(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/ticket-types', ['price' => -1])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['showtime_id', 'name', 'price']]);
    }

    public function test_admin_can_update_a_ticket_type(): void
    {
        $this->withToken($this->adminToken())
            ->putJson('/api/ticket-types/1', ['price' => 18.50])
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.price', '18.50')
            ->assertJsonPath('data.created_by', null)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('ticket_types', ['id' => 1, 'price' => 18.50, 'updated_by' => 1]);
    }

    public function test_admin_can_delete_a_ticket_type(): void
    {
        $this->withToken($this->adminToken())
            ->deleteJson('/api/ticket-types/2')
            ->assertOk()
            ->assertJsonPath('code', 200);

        $this->assertDatabaseMissing('ticket_types', ['id' => 2]);
    }

    public function test_admin_can_create_a_seat(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/seats', ['auditorium_id' => 1, 'row_label' => 'D', 'seat_number' => 1])
            ->assertCreated()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.row_label', 'D')
            ->assertJsonPath('data.seat_number', 1)
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.created_by', 1)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('seats', ['auditorium_id' => 1, 'row_label' => 'D', 'seat_number' => 1, 'created_by' => 1, 'updated_by' => 1]);
    }

    public function test_seat_store_validates_the_payload(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/seats', ['seat_number' => 0])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['auditorium_id', 'row_label', 'seat_number']]);
    }

    public function test_admin_can_update_a_seat_status(): void
    {
        $seat = Seat::first();

        $this->withToken($this->adminToken())
            ->putJson('/api/seats/'.$seat->id, ['status' => 'maintenance'])
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.status', 'maintenance')
            ->assertJsonPath('data.created_by', null)
            ->assertJsonPath('data.updated_by', 1);

        $this->assertDatabaseHas('seats', ['id' => $seat->id, 'status' => 'maintenance', 'updated_by' => 1]);
    }

    public function test_admin_can_delete_a_seat(): void
    {
        $seat = Seat::first();

        $this->withToken($this->adminToken())
            ->deleteJson('/api/seats/'.$seat->id)
            ->assertOk()
            ->assertJsonPath('code', 200);

        $this->assertDatabaseMissing('seats', ['id' => $seat->id]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validShowtimePayload(): array
    {
        return [
            'movie_id' => Movie::first()->id,
            'auditorium_id' => 2,
            'start_time' => now()->addDays(10)->setTime(20, 0)->toDateTimeString(),
            'format' => '2D',
        ];
    }
}
