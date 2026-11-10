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
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code', 20)->unique();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            $table->unsignedBigInteger('showtime_id')->index();
            $table->string('movie_title')->nullable();
            $table->string('cinema_name')->nullable();
            $table->string('auditorium_name')->nullable();
            $table->dateTime('showtime_start')->nullable();
            $table->unsignedInteger('total_tickets');
            $table->decimal('total_amount', 8, 2);
            $table->string('status', 20)->default('pending')->index();
            $table->string('payment_method', 50)->nullable();
            $table->string('payment_reference', 100)->nullable();
            $table->text('qr_payload')->nullable();
            $table->longText('qr_svg')->nullable();
            $table->dateTime('expires_at')->index();
            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};

