<?php

namespace Database\Seeders;

use App\Models\Incident;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Admin User
        $admin = User::updateOrCreate(
            ['email' => 'admin@justiceph.gov'],
            [
                'name' => 'JusticePH Provincial Administrator',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'municipality' => 'Laguna Province',
                'designation' => 'Super Administrator & Security Lead',
                'phone' => '+63 900 000 0001',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 2. Laguna Municipality Officials
        $officials = [
            [
                'name' => 'Atty. Maria Santos',
                'email' => 'santarosa.desk@justiceph.gov',
                'municipality' => 'Santa Rosa City',
                'designation' => 'City Legal Officer',
                'phone' => '+63 917 555 0101',
            ],
            [
                'name' => 'Officer Marco Flores',
                'email' => 'calamba.desk@justiceph.gov',
                'municipality' => 'Calamba City',
                'designation' => 'City Legal Desk Officer',
                'phone' => '+63 917 555 0102',
            ],
            [
                'name' => 'Officer Andrea Cruz',
                'email' => 'binan.desk@justiceph.gov',
                'municipality' => 'Biñan City',
                'designation' => 'Barangay Justice Desk Coordinator',
                'phone' => '+63 917 555 0103',
            ],
            [
                'name' => 'Officer Danilo Reyes',
                'email' => 'sanpedro.desk@justiceph.gov',
                'municipality' => 'San Pedro City',
                'designation' => 'Crisis Response & Legal Dispatcher',
                'phone' => '+63 917 555 0104',
            ],
            [
                'name' => 'Officer Elena Garcia',
                'email' => 'losbanos.desk@justiceph.gov',
                'municipality' => 'Los Baños',
                'designation' => 'MDRRMO Legal Liaison Officer',
                'phone' => '+63 917 555 0105',
            ],
            [
                'name' => 'Atty. Gabriel Mendoza',
                'email' => 'santacruz.desk@justiceph.gov',
                'municipality' => 'Santa Cruz',
                'designation' => 'Provincial Capital Legal Aid Officer',
                'phone' => '+63 917 555 0106',
            ],
        ];

        foreach ($officials as $official) {
            User::updateOrCreate(
                ['email' => $official['email']],
                [
                    'name' => $official['name'],
                    'password' => Hash::make('password'),
                    'role' => 'municipality',
                    'municipality' => $official['municipality'],
                    'designation' => $official['designation'],
                    'phone' => $official['phone'],
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );
        }

        // 3. Citizen / User
        $citizen = User::updateOrCreate(
            ['email' => 'citizen@justiceph.gov'],
            [
                'name' => 'Juan Dela Cruz',
                'password' => Hash::make('password'),
                'role' => 'user',
                'municipality' => 'Santa Rosa City',
                'designation' => null,
                'phone' => '+63 918 123 4567',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // 4. Sample Incidents in Laguna Municipalities
        $incidents = [
            [
                'case_number' => 'LAG-SR-2026-0088',
                'user_id' => $citizen->id,
                'citizen_name' => 'Eduardo Ramos',
                'phone' => '+63 917 555 0192',
                'municipality' => 'Santa Rosa City',
                'barangay' => 'Brgy. Tagapo',
                'category' => 'Legal Assistance / Consultation',
                'urgency' => 'urgent',
                'title' => 'Wrongful eviction notice served without 30-day barangay conciliation',
                'description' => 'Tenant received notice to vacate without prior Lupon Tagapamayapa mediation hearings. Requests urgent PAO Santa Rosa legal protection.',
                'status' => 'pending',
                'assigned_to' => null,
                'coordinates' => '14.3122, 121.1114',
            ],
            [
                'case_number' => 'LAG-CAL-2026-0085',
                'user_id' => null,
                'citizen_name' => 'Anonymous Citizen',
                'phone' => '+63 920 444 8812',
                'municipality' => 'Calamba City',
                'barangay' => 'Brgy. Real',
                'category' => 'Domestic & Family Safety',
                'urgency' => 'urgent',
                'title' => 'Urgent VAWC protective order filing request (RA 9262)',
                'description' => 'Citizen requires legal escort and temporary protection order (BPO) assistance from Calamba CSWD and Barangay desk.',
                'status' => 'assigned',
                'assigned_to' => 'Calamba CSWD & PNP Women’s Desk',
                'coordinates' => '14.2117, 121.1656',
            ],
            [
                'case_number' => 'LAG-BIN-2026-0079',
                'user_id' => null,
                'citizen_name' => 'Marites Alonzo',
                'phone' => '+63 918 222 7109',
                'municipality' => 'Biñan City',
                'barangay' => 'Brgy. San Vicente',
                'category' => 'Labor & Wage Dispute',
                'urgency' => 'routine',
                'title' => 'Unpaid final pay and withholding of 13th month salary',
                'description' => 'Displaced factory worker terminated without due process hearing. Preparation for SEnA mediation conference.',
                'status' => 'under_review',
                'assigned_to' => 'PAO Biñan District',
                'coordinates' => '14.3389, 121.0825',
            ],
            [
                'case_number' => 'LAG-SP-2026-0074',
                'user_id' => null,
                'citizen_name' => 'Roberto Valerio',
                'phone' => '+63 927 888 3401',
                'municipality' => 'San Pedro City',
                'barangay' => 'Brgy. Cuyab',
                'category' => 'Civil & Human Rights',
                'urgency' => 'high',
                'title' => 'Warrantless detention inquiry and custody rights assistance',
                'description' => 'Detained beyond statutory time limit under Art. 125 RPC without inquest docket. Requests PAO legal representation.',
                'status' => 'assigned',
                'assigned_to' => 'PAO San Pedro District',
                'coordinates' => '14.3589, 121.0167',
            ],
            [
                'case_number' => 'LAG-LB-2026-0068',
                'user_id' => null,
                'citizen_name' => 'Luzviminda Santos',
                'phone' => '+63 905 111 6398',
                'municipality' => 'Los Baños',
                'barangay' => 'Brgy. Batong Malake',
                'category' => 'Barangay Dispute & Mediation',
                'urgency' => 'routine',
                'title' => 'Boundary encroachment and easement conciliation resolved',
                'description' => 'Amicable settlement reached through Lupon Tagapamayapa. Formal Kasunduan signed by both parties.',
                'status' => 'resolved',
                'assigned_to' => 'Lupon Tagapamayapa Brgy. Batong Malake',
                'coordinates' => '14.1706, 121.2433',
                'resolution_notes' => 'Amicable settlement signed on Oct 20, 2026.',
            ],
        ];

        foreach ($incidents as $inc) {
            Incident::updateOrCreate(['case_number' => $inc['case_number']], $inc);
        }
    }
}
