import { apiClient } from "./client";
import type { ApiResponse } from "../types/auth";
import type { Movie } from "../data/mockCinema";

export interface CatalogCinemaDto {
  id: number;
  name: string;
  address: string;
  city: string;
}

export interface CatalogAuditoriumDto {
  id: number;
  cinema_id: number;
  name: string;
  capacity: number;
  cinema?: CatalogCinemaDto;
}

export interface CatalogTicketTypeDto {
  id: number;
  showtime_id: number;
  name: string;
  price: string | number;
}

export interface CatalogShowtimeDto {
  id: number;
  movie_id: string;
  auditorium_id: number;
  start_time: string;
  format: string;
  auditorium?: CatalogAuditoriumDto;
  ticket_types?: CatalogTicketTypeDto[];
}

export interface CatalogMovieDto {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  rating: string | null;
  poster_url: string | null;
  status: "draft" | "published" | "finished" | string;
  created_at?: string;
  updated_at?: string;
}

export interface CatalogMovieDetailDto extends CatalogMovieDto {
  cinemas?: CatalogCinemaDto[];
  showtimes?: CatalogShowtimeDto[];
}

export interface CatalogPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface MoviesListPayload {
  movies: CatalogMovieDto[];
  pagination: CatalogPagination;
}

export const mapCatalogMovieToMovie = (dto: CatalogMovieDto): Movie => {
  return {
    id: dto.id,
    title: dto.title,
    genre:
      dto.status === "published"
        ? "En cartelera"
        : dto.status === "draft"
          ? "Próximamente"
          : "Finalizada",
    duration: `${dto.duration_minutes} min`,
    duration_minutes: dto.duration_minutes,
    ageRating: dto.rating || "Todo público",
    rating: 8.8,
    synopsis: dto.description || "Sin descripción disponible.",
    poster: dto.poster_url || "/images/horizontes.jpg",
    status: dto.status,
    room: "Sala 1",
  };
};

export const catalogApi = {
  getMovies: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    cinema_id?: number | string;
  }): Promise<{
    movies: Movie[];
    raw: CatalogMovieDto[];
    pagination: CatalogPagination;
  }> => {
    const response = await apiClient.get<ApiResponse<MoviesListPayload>>(
      "/catalog/movies",
      { params },
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener el catálogo de películas",
      );
    }

    const raw = response.data.data.movies || [];
    return {
      movies: raw.map(mapCatalogMovieToMovie),
      raw,
      pagination: response.data.data.pagination,
    };
  },

  getMovieById: async (id: string): Promise<CatalogMovieDetailDto> => {
    const response = await apiClient.get<ApiResponse<CatalogMovieDetailDto>>(
      `/catalog/movies/${id}`,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener el detalle de la película",
      );
    }

    return response.data.data;
  },
};
