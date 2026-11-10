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
    // Auth / JWT (compartidos entre microservicios EventCore)
    // ------------------------------------------------------------------
    'auth.token_missing' => 'Token no proporcionado',
    'auth.token_expired' => 'Token expirado',
    'auth.token_revoked' => 'Token revocado (sesión cerrada)',
    'auth.token_invalid' => 'Token inválido',
    'auth.token_error' => 'No se pudo procesar el token',

    // ------------------------------------------------------------------
    // Salud del servicio
    // ------------------------------------------------------------------
    'service.healthy' => 'Servicio funcionando correctamente',
    'service.database_unavailable' => 'Base de datos no disponible',

    // ------------------------------------------------------------------
    // Reservas y Concurrencia (booking-service)
    // ------------------------------------------------------------------
    'booking.seats.availability' => 'Disponibilidad de asientos obtenida correctamente',
    'booking.reservations.list' => 'Reservas obtenidas correctamente',
    'booking.reservation.show' => 'Reserva obtenida correctamente',
    'booking.reservation.not_found' => 'Reserva no encontrada con el código especificado',
    'booking.reservation.store' => 'Reserva temporal creada y asientos bloqueados por 10 minutos',
    'booking.reservation.confirm' => 'Reserva confirmada y código QR generado correctamente',
    'booking.reservation.cancel' => 'Reserva cancelada y asientos liberados correctamente',
    'booking.reservation.seat_unavailable' => 'Uno o más asientos seleccionados ya están ocupados o bloqueados temporalmente',
    'booking.reservation.expired' => 'El tiempo de reserva de 10 minutos ha expirado; los asientos fueron liberados',
    'booking.reservation.already_confirmed' => 'La reserva ya se encuentra confirmada',
    'booking.reservation.cannot_confirm' => 'La reserva no puede ser confirmada en su estado actual',
    'booking.reservation.cannot_cancel' => 'La reserva ya se encuentra cancelada o expirada',
    'booking.reservation.qr_not_ready' => 'El código QR solo está disponible para reservas confirmadas',
    'booking.reservation.qr_show' => 'Código QR obtenido correctamente',
    'booking.reservation.qr_verified' => 'Código QR válido y verificado',
    'booking.reservation.qr_invalid' => 'Código QR inválido o alterado',
    'booking.reservation.tracking' => 'Seguimiento de la reserva obtenido correctamente',
];
