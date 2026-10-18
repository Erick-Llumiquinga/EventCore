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
        User::firstOrCreate(
            [
                'name' => 'Super Admin',
                'email' => 'super_admin@gamil.com',
                'password' => bcrypt('12345678'),
                'role_id' => 1,
            ]
        );
    }
}
