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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('case_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('citizen_name');
            $table->string('phone');
            $table->string('municipality');
            $table->string('barangay')->nullable();
            $table->string('category');
            $table->string('urgency')->default('routine');
            $table->string('title');
            $table->text('description');
            $table->string('status')->default('pending');
            $table->string('assigned_to')->nullable();
            $table->string('coordinates')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
