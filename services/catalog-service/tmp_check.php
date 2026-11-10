<?php

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo 'cinemas='.App\Models\Cinema::count().PHP_EOL;

$s = App\Models\Showtime::with(['movie', 'auditorium.cinema', 'ticketTypes'])->first();

if (! $s) {
    echo "no showtimes\n";

    exit(0);
}

echo 'keys='.implode(',', array_keys($s->toArray())).PHP_EOL;
echo 'relations='.implode(',', array_keys($s->getRelations())).PHP_EOL;
