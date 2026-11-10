<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = \App\Models\Role::where('slug', 'admin')->first();
        $organizerRole = \App\Models\Role::where('slug', 'organizer')->first();
        $clientRole = \App\Models\Role::where('slug', 'client')->first();

        // 1. Super Admin
        $adminPerson = \App\Models\Person::firstOrCreate(
            ['identification' => '0000000001'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'phone' => '0999999991',
            ]
        );

        User::firstOrCreate(
            ['email' => 'admin@eventcore.com'],
            [
                'person_id' => $adminPerson->id,
                'password' => bcrypt('password123'),
                'role_id' => $adminRole?->id,
                'is_active' => true,
            ]
        );

        // 2. Staff / Organizador de Cine
        if ($organizerRole) {
            $staffPerson = \App\Models\Person::firstOrCreate(
                ['identification' => '0000000002'],
                [
                    'first_name' => 'Staff',
                    'last_name' => 'Cine',
                    'phone' => '0999999992',
                ]
            );

            User::firstOrCreate(
                ['email' => 'organizer@eventcore.com'],
                [
                    'person_id' => $staffPerson->id,
                    'password' => bcrypt('password123'),
                    'role_id' => $organizerRole->id,
                    'is_active' => true,
                ]
            );
        }

        // 3. Cliente Demo
        if ($clientRole) {
            $clientPerson = \App\Models\Person::firstOrCreate(
                ['identification' => '0000000003'],
                [
                    'first_name' => 'Cliente',
                    'last_name' => 'Demo',
                    'phone' => '0999999993',
                ]
            );

            User::firstOrCreate(
                ['email' => 'client@eventcore.com'],
                [
                    'person_id' => $clientPerson->id,
                    'password' => bcrypt('password123'),
                    'role_id' => $clientRole->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
