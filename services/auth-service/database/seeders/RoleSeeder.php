<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Administrador',
                'description' => 'Acceso total al sistema, gestión de usuarios, roles y métricas globales',
            ]
        );

        Role::firstOrCreate(
            ['slug' => 'organizer'],
            [
                'name' => 'Organizador',
                'description' => 'Gestión y creación de eventos propios, localidades, precios y validación de QRs',
            ]
        );

        Role::firstOrCreate(
            ['slug' => 'client'],
            [
                'name' => 'Cliente',
                'description' => 'Cliente del cine: consulta cartelera, reserva butacas, compra entradas y consulta al asistente IA',
            ]
        );
    }
}
