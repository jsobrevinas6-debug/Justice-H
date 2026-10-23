<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndCaseFilingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Test citizen login.
     */
    public function test_citizen_can_login_successfully(): void
    {
        $response = $this->postJson('/auth/login', [
            'email' => 'citizen@justiceph.gov',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'user' => [
                'email' => 'citizen@justiceph.gov',
                'role' => 'user',
            ],
        ]);
        $this->assertAuthenticated();
    }

    /**
     * Test admin login redirects to admin dashboard.
     */
    public function test_admin_can_login_with_correct_redirect(): void
    {
        $response = $this->postJson('/auth/login', [
            'email' => 'admin@justiceph.gov',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'redirect' => '/admin/dashboard',
        ]);
    }

    /**
     * Test case filing endpoint saves incident in database with Laguna reference number.
     */
    public function test_user_can_file_case_for_laguna_municipality(): void
    {
        $user = User::where('email', 'citizen@justiceph.gov')->first();
        $this->actingAs($user);

        $response = $this->postJson('/api/cases', [
            'citizen_name' => 'Juan Dela Cruz',
            'phone' => '+63 918 123 4567',
            'municipality' => 'Santa Rosa City',
            'barangay' => 'Brgy. Balibago',
            'category' => 'Legal Assistance / Consultation',
            'urgency' => 'routine',
            'title' => 'Barangay mediation dispute regarding boundary',
            'description' => 'Dispute with neighbor regarding property boundary line.',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
            'case' => [
                'municipality' => 'Santa Rosa City',
                'barangay' => 'Brgy. Balibago',
                'status' => 'pending',
            ],
        ]);

        $this->assertDatabaseHas('incidents', [
            'municipality' => 'Santa Rosa City',
            'title' => 'Barangay mediation dispute regarding boundary',
        ]);
    }

    /**
     * Test listing cases by municipality.
     */
    public function test_can_list_cases_by_municipality(): void
    {
        $response = $this->getJson('/api/cases?municipality=Santa+Rosa+City');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'count',
            'cases',
        ]);
    }
}
