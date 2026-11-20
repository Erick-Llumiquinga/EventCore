import { apiClient } from "./client";
import type { ApiResponse } from "../types/auth";
import type { CatalogPagination, CatalogShowtimeDto } from "./catalog";

export interface SeatAvailabilityDto {
  id?: number;
  seat_code: string;
  row_label: string;
  seat_number: number;
  booking_status: "available" | "locked" | "confirmed" | "maintenance";
  is_available: boolean;
}

export interface ShowtimeAvailabilityResponse {
  showtime_id: number;
  showtime: CatalogShowtimeDto;
  confirmed_seats: string[];
  locked_seats: string[];
  occupied_seats: string[];
  seat_map: SeatAvailabilityDto[];
  lock_ttl_seconds: number;
}

export interface TicketItemDto {
  ticket_type: string;
  quantity: number;
  unit_price: number;
}

export interface CreateReservationDto {
  showtime_id: number;
  seats: string[];
  tickets?: TicketItemDto[];
  adult_tickets?: number;
  discount_tickets?: number;
  unit_price?: number;
  movie_title?: string;
  cinema_name?: string;
  auditorium_name?: string;
  showtime_start?: string;
}

export interface ReservationSeatDto {
  id: number;
  reservation_id: number;
  showtime_id: number;
  seat_code: string;
  row_label: string;
  seat_number: number;
  status: "locked" | "confirmed" | "released";
}

export interface ReservationTicketDto {
  id: number;
  reservation_id: number;
  ticket_type: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ReservationTrackingDto {
  id: number;
  reservation_id: number;
  event: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ReservationDto {
  id: number;
  booking_code: string;
  user_id: number;
  user_name?: string;
  user_email?: string;
  showtime_id: number;
  movie_title: string;
  cinema_name: string;
  auditorium_name: string;
  showtime_start: string;
  total_tickets: number;
  total_amount: number | string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  payment_method?: string;
  payment_reference?: string;
  seats: string[];
  seat_details?: ReservationSeatDto[];
  tickets?: ReservationTicketDto[];
  qr_svg?: string;
  qr_svg_data_uri?: string;
  expires_at: string;
  remaining_lock_seconds: number;
  confirmed_at?: string;
  cancelled_at?: string;
  created_at: string;
  trackings?: ReservationTrackingDto[];
}

export interface ConfirmReservationDto {
  payment_method?: string;
  card_holder?: string;
  card_last_four?: string;
  payment_reference?: string;
}

export interface ReservationsListPayload {
  reservations: ReservationDto[];
  pagination: CatalogPagination;
}

export const bookingApi = {
  /**
   * Obtiene la disponibilidad de asientos en tiempo real para una función
   * (incluye mapa físico de asientos + confirmados en PostgreSQL + bloqueados temporalmente en Redis).
   */
  getShowtimeSeats: async (
    showtimeId: number | string,
  ): Promise<ShowtimeAvailabilityResponse> => {
    const response = await apiClient.get<ApiResponse<ShowtimeAvailabilityResponse>>(
      `/booking/showtimes/${showtimeId}/seats`,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener la disponibilidad de asientos",
      );
    }

    return response.data.data;
  },

  /**
   * Crea una reserva y bloquea atómicamente los asientos en Redis por 10 minutos.
   */
  createReservation: async (
    payload: CreateReservationDto,
  ): Promise<ReservationDto> => {
    const response = await apiClient.post<ApiResponse<ReservationDto>>(
      "/booking/reservations",
      payload,
    );

    if (
      (response.data.code !== 200 && response.data.code !== 201) ||
      !response.data.data
    ) {
      throw new Error(
        response.data.message || "No se pudo crear la reserva de asientos",
      );
    }

    return response.data.data;
  },

  /**
   * Obtiene los detalles de una reserva mediante su código (EC-XXXXXX) o id.
   */
  getReservationByCode: async (code: string): Promise<ReservationDto> => {
    const response = await apiClient.get<ApiResponse<ReservationDto>>(
      `/booking/reservations/${code}`,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo encontrar la reserva",
      );
    }

    return response.data.data;
  },

  /**
   * Confirma el pago de una reserva dentro de la ventana de bloqueo de 10 minutos
   * y genera el código QR firmado digitalmente.
   */
  confirmReservation: async (
    code: string,
    payload?: ConfirmReservationDto,
  ): Promise<ReservationDto> => {
    const response = await apiClient.post<ApiResponse<ReservationDto>>(
      `/booking/reservations/${code}/confirm`,
      payload || {},
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo confirmar el pago de la reserva",
      );
    }

    return response.data.data;
  },

  /**
   * Cancela una reserva pendiente y libera de inmediato los bloqueos de asientos en Redis.
   */
  cancelReservation: async (code: string): Promise<ReservationDto> => {
    const response = await apiClient.post<ApiResponse<ReservationDto>>(
      `/booking/reservations/${code}/cancel`,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo cancelar la reserva",
      );
    }

    return response.data.data;
  },

  /**
   * Obtiene el código QR digital firmado para una reserva confirmada.
   */
  getReservationQr: async (
    code: string,
  ): Promise<{
    booking_code: string;
    status: string;
    qr_payload: string;
    qr_svg: string;
    qr_svg_data_uri: string;
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        booking_code: string;
        status: string;
        qr_payload: string;
        qr_svg: string;
        qr_svg_data_uri: string;
      }>
    >(`/booking/reservations/${code}/qr`);

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener el código QR de la reserva",
      );
    }

    return response.data.data;
  },

  /**
   * Lista el historial paginado de reservas del usuario autenticado.
   */
  getMyReservations: async (params?: {
    status?: string;
    showtime_id?: number;
    page?: number;
    per_page?: number;
  }): Promise<ReservationsListPayload> => {
    const response = await apiClient.get<ApiResponse<ReservationsListPayload>>(
      "/booking/reservations",
      { params },
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudieron obtener tus reservas",
      );
    }

    return response.data.data;
  },
};
