<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * docker-compose injects DB_* (pgsql/catalog_db) as real environment
     * variables into the container. PHPUnit's <env> entries cannot override
     * $_SERVER, so env() still resolves to pgsql during boot. Force the
     * in-memory sqlite connection here, before RefreshDatabase runs.
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }
}
