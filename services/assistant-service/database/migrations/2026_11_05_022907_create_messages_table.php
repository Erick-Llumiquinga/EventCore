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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('conversation_id');
            $table->string('role', 10); // user | assistant
            $table->text('content');
            $table->json('meta')->nullable(); // tool calls, usage tokens, mode
            $table->timestamps();

            $table->foreign('conversation_id')
                ->references('id')->on('conversations')
                ->cascadeOnDelete();
            $table->index(['conversation_id', 'id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
