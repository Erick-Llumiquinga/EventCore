<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('showtimes', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->foreignId('auditorium_id')->constrained('auditoriums')->cascadeOnDelete();
            $table->dateTime('start_time');
            $table->string('format');
            $table->timestamps();

            $table->index('start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('showtimes');
    }
};
