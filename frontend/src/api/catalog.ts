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
