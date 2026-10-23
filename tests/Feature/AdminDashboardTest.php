<?php

namespace Tests\Feature;

use App\Models\Incident;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the admin dashboard renders successfully.
     */
    public function test_admin_dashboard_returns_successful_response(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('AdminDashboard')
            ->has('adminName')
            ->has('adminEmail')
            ->has('adminRole')
        );
    }

    /**
     * Test database roles for Admin, Municipality, and User.
     */
    public function test_database_contains_seeded_roles(): void
    {
        $this->seed(DatabaseSeeder::class);

        $admin = User::where('email', 'admin@justiceph.gov')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->isAdmin());
        $this->assertSame('admin', $admin->role);

        $municipality = User::where('email', 'santarosa.desk@justiceph.gov')->first();
        $this->assertNotNull($municipality);
        $this->assertTrue($municipality->isMunicipality());
        $this->assertSame('municipality', $municipality->role);
        $this->assertSame('Santa Rosa City', $municipality->municipality);

        $citizen = User::where('email', 'citizen@justiceph.gov')->first();
        $this->assertNotNull($citizen);
        $this->assertTrue($citizen->isUser());
        $this->assertSame('user', $citizen->role);
    }

    /**
     * Test database incidents exist and relate to users.
     */
    public function test_database_contains_seeded_incidents(): void
    {
        $this->seed(DatabaseSeeder::class);

        $incident = Incident::where('case_number', 'LAG-SR-2026-0088')->first();
        $this->assertNotNull($incident);
        $this->assertSame('Santa Rosa City', $incident->municipality);
        $this->assertNotNull($incident->user);
    }
}
