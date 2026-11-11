<?php

namespace Tests\Feature;

use App\Models\Cinema;
use App\Models\Movie;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\MakesJwtTokens;
use Tests\TestCase;

class MovieCinemaApiTest extends TestCase
{
    use MakesJwtTokens, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_sync_requires_a_token(): void
    {
        $this->postJson('/api/cinemas/1/movies', ['movie_ids' => []])
            ->assertUnauthorized()
            ->assertJsonPath('code', 500);
    }

    public function test_sync_forbids_non_admin_roles(): void
    {
        $this->withToken($this->attendeeToken())
            ->postJson('/api/cinemas/1/movies', ['movie_ids' => []])
            ->assertForbidden()
            ->assertJsonPath('code', 500);
    }

    public function test_sync_validates_the_payload(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/cinemas/1/movies', ['movie_ids' => 'not-an-array'])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['movie_ids']]);
    }

    public function test_sync_rejects_unknown_movie_ids(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/cinemas/1/movies', ['movie_ids' => ['00000000-0000-4000-8000-000000000000']])
            ->assertStatus(422)
            ->assertJsonPath('code', 500)
            ->assertJsonStructure(['code', 'message', 'errors' => ['movie_ids.0']]);
    }

    public function test_sync_returns_404_for_unknown_cinema(): void
    {
        $this->withToken($this->adminToken())
            ->postJson('/api/cinemas/999999/movies', ['movie_ids' => []])
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_admin_can_sync_the_billboard(): void
    {
        $galaxias = Movie::where('title', 'like', 'Galaxias%')->firstOrFail();

        $this->withToken($this->adminToken())
            ->postJson('/api/cinemas/2/movies', ['movie_ids' => [$galaxias->id]])
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $galaxias->id);

        $this->assertTrue(Cinema::find(2)->movies()->where('movies.id', $galaxias->id)->exists());
    }

    public function test_sync_replaces_the_previous_billboard(): void
    {
        $galaxias = Movie::where('title', 'like', 'Galaxias%')->firstOrFail();
        $misterio = Movie::where('title', 'like', 'El Misterio%')->firstOrFail();

        // Cinema 1 is seeded with three movies; sync leaves only one.
        $this->withToken($this->adminToken())
            ->postJson('/api/cinemas/1/movies', ['movie_ids' => [$misterio->id]])
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertSame(
            [$misterio->id],
            Cinema::find(1)->movies()->pluck('movies.id')->all()
        );
        $this->assertFalse(Cinema::find(1)->movies()->where('movies.id', $galaxias->id)->exists());
    }

    public function test_admin_can_detach_one_movie(): void
    {
        $galaxias = Movie::where('title', 'like', 'Galaxias%')->firstOrFail();

        $this->withToken($this->adminToken())
            ->deleteJson('/api/cinemas/2/movies/'.$galaxias->id)
            ->assertOk()
            ->assertJsonPath('code', 200)
            ->assertJsonPath('data.movie_id', $galaxias->id);

        $this->assertFalse(Cinema::find(2)->movies()->where('movies.id', $galaxias->id)->exists());
    }

    public function test_detach_returns_404_for_unknown_movie(): void
    {
        $this->withToken($this->adminToken())
            ->deleteJson('/api/cinemas/2/movies/00000000-0000-4000-8000-000000000000')
            ->assertNotFound()
            ->assertJsonPath('code', 500)
            ->assertJsonPath('message', 'Endpoint no encontrado');
    }

    public function test_movie_detail_shows_its_cinemas(): void
    {
        $galaxias = Movie::where('title', 'like', 'Galaxias%')->firstOrFail();

        $this->withToken($this->adminToken())
            ->getJson('/api/movies/'.$galaxias->id)
            ->assertOk()
            ->assertJsonCount(2, 'data.cinemas')
            ->assertJsonStructure(['data' => ['cinemas' => [['id', 'name', 'city']]]]);
    }
}
