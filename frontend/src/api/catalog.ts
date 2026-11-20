import { apiClient } from "./client";
import type { ApiResponse } from "../types/auth";
import type { Movie } from "../data/mockCinema";

export interface CatalogCinemaDto {
  id: number;
  name: string;
  address: string;
  city: string;
  auditoriums_count?: number;
  auditoriums?: CatalogAuditoriumDto[];
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

export interface CinemasListPayload {
  cinemas: CatalogCinemaDto[];
  pagination: CatalogPagination;
}

export interface ShowtimesListPayload {
  showtimes: CatalogShowtimeDto[];
  pagination: CatalogPagination;
}

export interface CatalogSeatDto {
  id: number;
  auditorium_id: number;
  row_label: string;
  seat_number: number;
  status: "active" | "inactive" | "maintenance" | string;
}

export interface CreateAuditoriumPayload {
  cinema_id: number;
  name: string;
  capacity: number;
}

export interface UpdateAuditoriumPayload {
  name?: string;
  capacity?: number;
}

export interface CreateShowtimePayload {
  movie_id: string;
  auditorium_id: number;
  start_time: string;
  format: string;
}

export interface UpdateShowtimePayload {
  movie_id?: string;
  auditorium_id?: number;
  start_time?: string;
  format?: string;
}

export interface CreateTicketTypePayload {
  showtime_id: number;
  name: string;
  price: number;
}

export interface SyncCinemaMoviesPayload {
  movie_ids: string[];
}

export interface CachedMoviesResult {
  movies: Movie[];
  raw: CatalogMovieDto[];
  pagination: CatalogPagination;
}

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MOVIES_LIST_STORAGE_KEY = "eventcore_catalog_movies_v1";
const MOVIE_DETAIL_STORAGE_PREFIX = "eventcore_catalog_movie_detail_v1_";

// In-memory cache + in-flight request deduplication
const memoryMoviesCache = new Map<string, CacheEntry<CachedMoviesResult>>();
const memoryMovieDetailCache = new Map<
  string,
  CacheEntry<CatalogMovieDetailDto>
>();
const inFlightMoviesRequests = new Map<string, Promise<CachedMoviesResult>>();
const inFlightDetailRequests = new Map<
  string,
  Promise<CatalogMovieDetailDto>
>();

function readStorageCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeStorageCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { timestamp: Date.now(), data };
    const serialized = JSON.stringify(entry);
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
  } catch {
    // Ignore storage quota errors
  }
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
  getMovies: async (
    params?: {
      page?: number;
      per_page?: number;
      status?: string;
      cinema_id?: number | string;
    },
    options?: { forceRefresh?: boolean },
  ): Promise<CachedMoviesResult> => {
    const queryKey = JSON.stringify(params || { per_page: 15 });
    const storageKey = `${MOVIES_LIST_STORAGE_KEY}_${queryKey}`;

    if (!options?.forceRefresh) {
      // 1. Check in-memory cache first
      const mem = memoryMoviesCache.get(queryKey);
      if (mem && Date.now() - mem.timestamp <= CACHE_TTL_MS) {
        return mem.data;
      }

      // 2. Check persisted storage cache
      const stored = readStorageCache<CachedMoviesResult>(storageKey);
      if (stored) {
        memoryMoviesCache.set(queryKey, {
          timestamp: Date.now(),
          data: stored,
        });
        return stored;
      }

      // 3. Deduplicate concurrent requests
      const existingRequest = inFlightMoviesRequests.get(queryKey);
      if (existingRequest) {
        return existingRequest;
      }
    }

    const requestPromise = (async () => {
      try {
        const response = await apiClient.get<ApiResponse<MoviesListPayload>>(
          "/catalog/movies",
          { params },
        );

        if (response.data.code !== 200 || !response.data.data) {
          throw new Error(
            response.data.message ||
              "No se pudo obtener el catálogo de películas",
          );
        }

        const raw = response.data.data.movies || [];
        const result: CachedMoviesResult = {
          movies: raw.map(mapCatalogMovieToMovie),
          raw,
          pagination: response.data.data.pagination,
        };

        memoryMoviesCache.set(queryKey, {
          timestamp: Date.now(),
          data: result,
        });
        writeStorageCache(storageKey, result);

        return result;
      } finally {
        inFlightMoviesRequests.delete(queryKey);
      }
    })();

    inFlightMoviesRequests.set(queryKey, requestPromise);
    return requestPromise;
  },

  getMovieById: async (
    id: string,
    options?: { forceRefresh?: boolean },
  ): Promise<CatalogMovieDetailDto> => {
    const storageKey = `${MOVIE_DETAIL_STORAGE_PREFIX}${id}`;

    if (!options?.forceRefresh) {
      // 1. Check in-memory cache
      const mem = memoryMovieDetailCache.get(id);
      if (mem && Date.now() - mem.timestamp <= CACHE_TTL_MS) {
        return mem.data;
      }

      // 2. Check persisted storage cache
      const stored = readStorageCache<CatalogMovieDetailDto>(storageKey);
      if (stored) {
        memoryMovieDetailCache.set(id, {
          timestamp: Date.now(),
          data: stored,
        });
        return stored;
      }

      // 3. Deduplicate concurrent requests
      const existingRequest = inFlightDetailRequests.get(id);
      if (existingRequest) {
        return existingRequest;
      }
    }

    const requestPromise = (async () => {
      try {
        const response = await apiClient.get<
          ApiResponse<CatalogMovieDetailDto>
        >(`/catalog/movies/${id}`);

        if (response.data.code !== 200 || !response.data.data) {
          throw new Error(
            response.data.message ||
              "No se pudo obtener el detalle de la película",
          );
        }

        const detail = response.data.data;
        memoryMovieDetailCache.set(id, {
          timestamp: Date.now(),
          data: detail,
        });
        writeStorageCache(storageKey, detail);

        return detail;
      } finally {
        inFlightDetailRequests.delete(id);
      }
    })();

    inFlightDetailRequests.set(id, requestPromise);
    return requestPromise;
  },

  getCinemas: async (params?: {
    page?: number;
    per_page?: number;
    city?: string;
  }): Promise<{
    cinemas: CatalogCinemaDto[];
    pagination: CatalogPagination;
  }> => {
    const response = await apiClient.get<ApiResponse<CinemasListPayload>>(
      "/catalog/cinemas",
      { params: params || { per_page: 50 } },
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener la lista de cines",
      );
    }

    return {
      cinemas: response.data.data.cinemas || [],
      pagination: response.data.data.pagination,
    };
  },

  getShowtimes: async (params?: {
    movie_id?: string;
    cinema_id?: number | string;
    date?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    showtimes: CatalogShowtimeDto[];
    pagination: CatalogPagination;
  }> => {
    const response = await apiClient.get<ApiResponse<ShowtimesListPayload>>(
      "/catalog/showtimes",
      { params: params || { per_page: 50 } },
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudieron obtener las funciones",
      );
    }

    return {
      showtimes: response.data.data.showtimes || [],
      pagination: response.data.data.pagination,
    };
  },

  getShowtimeById: async (id: number | string): Promise<CatalogShowtimeDto> => {
    const response = await apiClient.get<ApiResponse<CatalogShowtimeDto>>(
      `/catalog/showtimes/${id}`,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener la información de la función",
      );
    }

    return response.data.data;
  },

  getShowtimeTicketTypes: async (
    showtimeId: number | string,
  ): Promise<CatalogTicketTypeDto[]> => {
    const response = await apiClient.get<ApiResponse<CatalogTicketTypeDto[]>>(
      `/catalog/showtimes/${showtimeId}/ticket-types`,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudieron obtener los tipos de boleto",
      );
    }

    return response.data.data || [];
  },

  getShowtimeSeats: async (
    showtimeId: number | string,
  ): Promise<CatalogSeatDto[]> => {
    const response = await apiClient.get<ApiResponse<CatalogSeatDto[]>>(
      `/catalog/showtimes/${showtimeId}/seats`,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener el mapa de asientos del auditorio",
      );
    }

    return response.data.data || [];
  },

  createAuditorium: async (
    payload: CreateAuditoriumPayload,
  ): Promise<CatalogAuditoriumDto> => {
    const response = await apiClient.post<ApiResponse<CatalogAuditoriumDto>>(
      "/catalog/auditoriums",
      payload,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(response.data.message || "Error al crear la sala");
    }

    catalogApi.clearCache();
    return response.data.data;
  },

  updateAuditorium: async (
    id: number,
    payload: UpdateAuditoriumPayload,
  ): Promise<CatalogAuditoriumDto> => {
    const response = await apiClient.put<ApiResponse<CatalogAuditoriumDto>>(
      `/catalog/auditoriums/${id}`,
      payload,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(response.data.message || "Error al actualizar la sala");
    }

    catalogApi.clearCache();
    return response.data.data;
  },

  deleteAuditorium: async (id: number): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<{ id: number }>>(
      `/catalog/auditoriums/${id}`,
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.message || "Error al eliminar la sala");
    }

    catalogApi.clearCache();
  },

  getCinemaDetail: async (
    cinemaId: number | string,
  ): Promise<
    CatalogCinemaDto & {
      movies?: (CatalogMovieDto & { showtimes?: CatalogShowtimeDto[] })[];
    }
  > => {
    const response = await apiClient.get<
      ApiResponse<
        CatalogCinemaDto & {
          movies?: (CatalogMovieDto & { showtimes?: CatalogShowtimeDto[] })[];
        }
      >
    >(`/catalog/cinemas/${cinemaId}`);

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "No se pudo obtener el detalle del cine",
      );
    }

    return response.data.data;
  },

  createShowtime: async (
    payload: CreateShowtimePayload,
  ): Promise<CatalogShowtimeDto> => {
    const response = await apiClient.post<ApiResponse<CatalogShowtimeDto>>(
      "/catalog/showtimes",
      payload,
    );

    if (
      (response.data.code !== 200 && response.data.code !== 201) ||
      !response.data.data
    ) {
      throw new Error(response.data.message || "Error al programar la función");
    }

    catalogApi.clearCache();
    return response.data.data;
  },

  updateShowtime: async (
    id: number,
    payload: UpdateShowtimePayload,
  ): Promise<CatalogShowtimeDto> => {
    const response = await apiClient.put<ApiResponse<CatalogShowtimeDto>>(
      `/catalog/showtimes/${id}`,
      payload,
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(response.data.message || "Error al actualizar la función");
    }

    catalogApi.clearCache();
    return response.data.data;
  },

  deleteShowtime: async (id: number): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<{ id: number }>>(
      `/catalog/showtimes/${id}`,
    );

    if (response.data.code !== 200) {
      throw new Error(response.data.message || "Error al eliminar la función");
    }

    catalogApi.clearCache();
  },

  createTicketType: async (
    payload: CreateTicketTypePayload,
  ): Promise<CatalogTicketTypeDto> => {
    const response = await apiClient.post<ApiResponse<CatalogTicketTypeDto>>(
      "/catalog/ticket-types",
      payload,
    );

    if (
      (response.data.code !== 200 && response.data.code !== 201) ||
      !response.data.data
    ) {
      throw new Error(
        response.data.message || "Error al registrar la tarifa de boleto",
      );
    }

    return response.data.data;
  },

  syncCinemaMovies: async (
    cinemaId: number | string,
    movieIds: string[],
  ): Promise<CatalogMovieDto[]> => {
    const response = await apiClient.post<ApiResponse<CatalogMovieDto[]>>(
      `/catalog/cinemas/${cinemaId}/movies`,
      { movie_ids: movieIds },
    );

    if (response.data.code !== 200 || !response.data.data) {
      throw new Error(
        response.data.message || "Error al actualizar la cartelera del cine",
      );
    }

    catalogApi.clearCache();
    return response.data.data;
  },

  detachCinemaMovie: async (
    cinemaId: number | string,
    movieId: string,
  ): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<{ movie_id: string }>>(
      `/catalog/cinemas/${cinemaId}/movies/${movieId}`,
    );

    if (response.data.code !== 200) {
      throw new Error(
        response.data.message || "Error al retirar película de la cartelera",
      );
    }

    catalogApi.clearCache();
  },

  clearCache: (): void => {
    memoryMoviesCache.clear();
    memoryMovieDetailCache.clear();
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith("eventcore_catalog_")) sessionStorage.removeItem(k);
      });
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("eventcore_catalog_")) localStorage.removeItem(k);
      });
    } catch {
      // Ignore
    }
  },
};
