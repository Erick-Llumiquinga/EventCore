<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Seat Lock TTL (Seconds)
    |--------------------------------------------------------------------------
    |
    | Duration in seconds for temporary seat locks in Redis before payment
    | is confirmed. Default is 600 seconds (10 minutes).
    |
    */
    'seat_lock_ttl_seconds' => (int) env('SEAT_LOCK_TTL_SECONDS', 600),

    /*
    |--------------------------------------------------------------------------
    | Catalog Service Internal URL
    |--------------------------------------------------------------------------
    |
    | Internal Docker URL for catalog-service to optionally enrich showtime
    | details when creating a reservation.
    |
    */
    'catalog_service_url' => env('CATALOG_SERVICE_URL', 'http://catalog-service:8000/api'),

    /*
    |--------------------------------------------------------------------------
    | Default Ticket Prices
    |--------------------------------------------------------------------------
    |
    | Fallback ticket prices matching catalog-service and frontend defaults.
    |
    */
    'default_adult_price' => 15.00,
    'default_discount_price' => 7.50,
];

