<?php

return [
    // ------------------------------------------------------------------
    // Mensajes comunes de todas las respuestas
    // ------------------------------------------------------------------
    'common.success' => 'Operación exitosa',
    'common.validation_errors' => 'Errores de validación',
    'common.server_error' => 'Error interno del servidor',
    'common.request_error' => 'Error en la solicitud',
    'common.unauthorized' => 'No autenticado',
    'common.forbidden' => 'No tienes permisos para realizar esta acción',

    // ------------------------------------------------------------------
    // Endpoints / rutas
    // ------------------------------------------------------------------
    'endpoint.not_found' => 'Endpoint no encontrado',
    'endpoint.method_not_allowed' => 'Método no permitido',

    // ------------------------------------------------------------------
    // Auth / JWT (compartidos entre auth-service y catalog-service)
    // ------------------------------------------------------------------
    'auth.token_missing' => 'Token no proporcionado',
    'auth.token_expired' => 'Token expirado',
    'auth.token_revoked' => 'Token revocado (sesión cerrada)',
    'auth.token_invalid' => 'Token inválido',
    'auth.token_error' => 'No se pudo procesar el token',
    'auth.invalid_credentials' => 'Credenciales inválidas',
    'auth.register_success' => 'Usuario registrado exitosamente',
    'auth.login_success' => 'Inicio de sesión exitoso',
    'auth.logout_success' => 'Sesión cerrada correctamente',
    'auth.profile_success' => 'Perfil obtenido correctamente',
    'auth.refresh_success' => 'Token refrescado correctamente',

    // ------------------------------------------------------------------
    // Salud del servicio
    // ------------------------------------------------------------------
    'service.healthy' => 'Servicio funcionando correctamente',
    'service.database_unavailable' => 'Base de datos no disponible',

    // ------------------------------------------------------------------
    // Catálogo: cines
    // ------------------------------------------------------------------
    'catalog.cinemas.list' => 'Cines obtenidos correctamente',
    'catalog.cinema.show' => 'Cine obtenido correctamente',
    'catalog.cinema.store' => 'Cine creado correctamente',
    'catalog.cinema.update' => 'Cine actualizado correctamente',
    'catalog.cinema.delete' => 'Cine eliminado correctamente',
    'catalog.cinema.delete_blocked' => 'No se puede eliminar: el cine tiene salas o funciones asociadas',

    // ------------------------------------------------------------------
    // Catálogo: películas
    // ------------------------------------------------------------------
    'catalog.movies.list' => 'Películas obtenidas correctamente',
    'catalog.movie.show' => 'Película obtenida correctamente',
    'catalog.movie.store' => 'Película creada correctamente',
    'catalog.movie.update' => 'Película actualizada correctamente',
    'catalog.movie.delete' => 'Película eliminada correctamente',

    // ------------------------------------------------------------------
    // Catálogo: auditorios
    // ------------------------------------------------------------------
    'catalog.auditoriums.list' => 'Auditorios obtenidos correctamente',
    'catalog.auditorium.show' => 'Auditorio obtenido correctamente',
    'catalog.auditorium.store' => 'Auditorio creado correctamente',
    'catalog.auditorium.update' => 'Auditorio actualizado correctamente',
    'catalog.auditorium.delete' => 'Auditorio eliminado correctamente',
    'catalog.auditorium.delete_blocked' => 'No se puede eliminar: el auditorio tiene funciones asociadas',

    // ------------------------------------------------------------------
    // Catálogo: funciones / horarios
    // ------------------------------------------------------------------
    'catalog.showtimes.list' => 'Funciones obtenidas correctamente',
    'catalog.showtime.show' => 'Función obtenida correctamente',
    'catalog.showtime.store' => 'Función creada correctamente',
    'catalog.showtime.update' => 'Función actualizada correctamente',
    'catalog.showtime.delete' => 'Función eliminada correctamente',

    // ------------------------------------------------------------------
    // Catálogo: tipos de boleto
    // ------------------------------------------------------------------
    'catalog.ticket_types.list' => 'Tipos de boleto obtenidos correctamente',
    'catalog.ticket_type.store' => 'Tipo de boleto creado correctamente',
    'catalog.ticket_type.update' => 'Tipo de boleto actualizado correctamente',
    'catalog.ticket_type.delete' => 'Tipo de boleto eliminado correctamente',

    // ------------------------------------------------------------------
    // Catálogo: asientos
    // ------------------------------------------------------------------
    'catalog.seats.list' => 'Asientos obtenidos correctamente',
    'catalog.seat.store' => 'Asiento creado correctamente',
    'catalog.seat.update' => 'Asiento actualizado correctamente',
    'catalog.seat.delete' => 'Asiento eliminado correctamente',
];
