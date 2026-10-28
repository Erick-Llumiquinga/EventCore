<?php

namespace Tests\Feature;

use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class ShowtimeApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_showtimes_requires_a_bearer_token(): void
    {
        $this->getJson('/api/showtimes?movie_id='.Movie::first()->id)
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_showtimes_requires_at_least_one_filter(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes')
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Errores de validación');
    }

    public function test_showtimes_filters_by_movie(): void
    {
        $movie = Movie::where('title', 'like', 'Galaxias%')->first();

        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes?movie_id='.$movie->id)
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.total', 2)
            ->assertJsonStructure(['code', 'message', 'data' => ['current_page', 'data', 'total', 'per_page']]);
    }

    public function test_showtimes_filters_by_cinema(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes?cinema_id=1')
            ->assertOk()
            ->assertJsonPath('data.total', 5);

        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes?cinema_id=2')
            ->assertOk()
            ->assertJsonPath('data.total', 3);
    }

    public function test_showtimes_filters_by_date(): void
    {
        $date = now()->addDay()->toDateString();

        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes?date='.$date)
            ->assertOk()
            ->assertJsonPath('data.total', 3);
    }

    public function test_showtime_detail_returns_movie_auditorium_and_ticket_types(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes/1')
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.id', 1)
            ->assertJsonStructure([
                'data' => [
                    'id', 'start_time', 'format',
                    'movie' => ['id', 'title'],
                    'auditorium' => ['id', 'name', 'cinema' => ['id', 'name', 'city']],
                    'ticket_types' => [['id', 'name', 'price']],
                ],
            ]);
    }

    public function test_showtime_returns_404_for_unknown_showtime(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes/999999')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_showtime_returns_404_for_malformed_id(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes/abc')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_ticket_types_returns_prices_for_a_showtime(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes/1/ticket-types')
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', '3ra Edad')
            ->assertJsonPath('data.0.price', '7.60')
            ->assertJsonPath('data.1.name', 'General')
            ->assertJsonPath('data.1.price', '15.20');
    }

    public function test_ticket_types_returns_404_for_unknown_showtime(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes/999999/ticket-types')
            ->assertNotFound()
            ->assertJsonPath('code', 500);
    }

    public function test_seats_returns_the_seat_map_of_the_showtime_auditorium(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes/1/seats')
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('data.0.row_label', 'A')
            ->assertJsonPath('data.0.seat_number', 1)
            ->assertJsonStructure(['data' => [['id', 'auditorium_id', 'row_label', 'seat_number', 'status']]]);
    }

    public function test_seats_returns_404_for_unknown_showtime(): void
    {
        $this->withToken($this->adminToken())
            ->getJson('/api/showtimes/999999/seats')
            ->assertNotFound()
            ->assertJsonPath('code', 500);
    }
}
