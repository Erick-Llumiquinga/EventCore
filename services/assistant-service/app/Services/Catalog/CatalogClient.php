<?php

namespace App\Services\Catalog;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Read-only HTTP client for catalog-service. The caller's Bearer token is
 * forwarded on every request so catalog verifies it with the shared secret.
 */
class CatalogClient
{
    /**
     * GET {CATALOG_SERVICE_URL}{path} and return the `data` envelope.
     *
     * @param  array<string, scalar|null>  $query
     * @return array<mixed>|null
     *
     * @throws CatalogException
     */
    public function get(string $path, array $query = [], string $token = ''): ?array
    {
        $url = config('services.catalog.url').$path;
        $query = array_filter($query, fn ($value) => $value !== null && $value !== '');

        try {
            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout((int) config('services.catalog.timeout', 10))
                ->get($url, $query);
        } catch (ConnectionException $e) {
            throw new CatalogException('catalog-service inaccesible: '.$e->getMessage(), 0, $e);
        }

        $body = $response->json();
        $contractCode = is_array($body) ? ($body['code'] ?? null) : null;

        if (! $response->successful() || $contractCode !== 200) {
            $message = is_array($body) && ! empty($body['message'])
                ? (string) $body['message']
                : 'catalog-service respondió '.$response->status();

            throw new CatalogException($message, $response->status());
        }

        $data = $body['data'] ?? null;

        return is_array($data) ? $data : ($data === null ? null : ['value' => $data]);
    }
}
