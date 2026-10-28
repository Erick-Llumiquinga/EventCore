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
        Schema::create('auditoriums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cinema_id')->constrained('cinemas')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('capacity');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auditoriums');
    }
};
