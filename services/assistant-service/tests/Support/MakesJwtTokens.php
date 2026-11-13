<?php

namespace Tests\Support;

use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

trait MakesJwtTokens
{
    /**
     * Build a JWT signed with the same secret shared with auth-service.
     */
    protected function makeToken(array $claims = [], int $sub = 1): string
    {
        $subject = new class($claims, $sub) implements JWTSubject
        {
            public function __construct(
                private array $claims,
                private int $sub,
            ) {}

            public function getJWTIdentifier(): mixed
            {
                return $this->sub;
            }

            public function getJWTCustomClaims(): array
            {
                return $this->claims;
            }
        };

        return app('tymon.jwt.auth')->fromSubject($subject);
    }

    protected function adminToken(): string
    {
        return $this->makeToken([
            'role' => 'admin',
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
        ]);
    }

    protected function attendeeToken(): string
    {
        return $this->makeToken([
            'role' => 'attendee',
            'name' => 'Attendee Test',
            'email' => 'attendee@test.com',
        ], 2);
    }
}
