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
        Schema::create('movie_cinema', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->foreignId('cinema_id')->constrained('cinemas')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['movie_id', 'cinema_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_cinema');
    }
};
