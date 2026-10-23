<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MunicipalityDashboardTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the municipality dashboard renders successfully.
     */
    public function test_municipality_dashboard_returns_successful_response(): void
    {
        $response = $this->get('/municipality/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('MunicipalityDashboard')
            ->has('initialMunicipality')
            ->has('officialName')
            ->has('officialRole')
        );
    }

    /**
     * Test that the municipality dashboard accepts custom query parameters.
     */
    public function test_municipality_dashboard_accepts_custom_query_parameters(): void
    {
        $response = $this->get('/municipality/dashboard?municipality=Santa+Rosa+City&name=Captain+Reyes&role=Barangay+Desk');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('MunicipalityDashboard')
            ->where('initialMunicipality', 'Santa Rosa City')
            ->where('officialName', 'Captain Reyes')
            ->where('officialRole', 'Barangay Desk')
        );
    }
}
