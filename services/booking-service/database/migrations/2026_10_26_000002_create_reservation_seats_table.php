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
        Schema::create('reservation_seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->unsignedBigInteger('showtime_id')->index();
            $table->string('seat_code', 10);
            $table->string('row_label', 5);
            $table->unsignedSmallInteger('seat_number');
            $table->string('status', 20)->default('locked')->index();
            $table->timestamps();

            $table->unique(['reservation_id', 'seat_code']);
            $table->index(['showtime_id', 'seat_code', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservation_seats');
    }
};

