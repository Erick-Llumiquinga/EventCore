import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBooking } from "../context/BookingContext";
import { catalogApi } from "../api/catalog";
import type { Movie } from "../data/mockCinema";
import { LoginModal } from "../components/LoginModal";
import {
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Film,
  Loader2,
  ShieldAlert,
} from "lucide-react";

const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: "/images/carousel/slide-4.jpg",
    alt: "Los mejores estrenos y eventos - EventCore",
  },
  {
    id: 2,
    image: "/images/carousel/slide-1.jpg",
    alt: "Reserva tus entradas al instante - EventCore",
  },
  {
    id: 3,
    image: "/images/carousel/slide-2.jpg",
    alt: "Vive la experiencia del cine - EventCore",
  },
  {
    id: 4,
    image: "/images/carousel/slide-3.jpg",
    alt: "Estrenos y eventos exclusivos - EventCore",
  },
];

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { setSelectedMovie } = useBooking();
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(false);
  const [moviesError, setMoviesError] = useState<string | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length,
    );
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      setIsLoadingMovies(true);
      setMoviesError(null);
      try {
        const result = await catalogApi.getMovies({ per_page: 15 });
        if (isMounted) {
          setMovies(result.movies);
          if (result.movies.length > 0) {
            setSelectedMovie(result.movies[0]);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setMoviesError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las películas del catálogo.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingMovies(false);
        }
      }
    };

    fetchMovies();

    return () => {
      isMounted = false;
    };
  }, [setSelectedMovie]);

  const handleReserveClick = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    navigate("/peliculas");
  };

  const handleSelectMovieCard = (movie: Movie) => {
    setSelectedMovie(movie);
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    navigate("/funcion");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#1b1c20] text-[#F2F0EB] flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* Full-Width Carousel Section */}
        <section className="relative w-full">
          <div className="relative w-full h-[260px] sm:h-[360px] md:h-[440px] lg:h-[500px] overflow-hidden bg-[#121316] border-b border-white/10">
            {CAROUSEL_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide
                    ? "opacity-100 z-10"
                    : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="w-full h-full object-cover object-center"
                />
                {/* Subtle top and bottom vignette for seamless blending */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#1b1c20]/80 pointer-events-none" />
              </div>
            ))}

            {/* Left Navigation Button */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Anterior"
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1b1c20]/75 hover:bg-[#1b1c20] border border-white/15 hover:border-[#C7AA78] text-[#F2F0EB]/80 hover:text-[#C7AA78] flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Navigation Button */}
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Siguiente"
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1b1c20]/75 hover:bg-[#1b1c20] border border-white/15 hover:border-[#C7AA78] text-[#F2F0EB]/80 hover:text-[#C7AA78] flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2.5 pt-5">
            {CAROUSEL_SLIDES.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Ir a diapositiva ${index + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "w-7 bg-[#C7AA78]"
                      : "w-2 bg-white/25 hover:bg-white/45"
                  }`}
                />
              );
            })}
          </div>
        </section>

        {/* Hero Text, CTA & Catalog Movie Cards Section */}
        <section className="relative pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#C7AA78]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#FFFFFF] mb-5 leading-tight">
              Gestión y Reserva de
              <br />
              Eventos con{" "}
              <span className="text-[#C7AA78]">EventCore</span>
            </h1>

            <p className="text-sm sm:text-base text-[#F2F0EB]/75 mb-9 leading-relaxed max-w-2xl mx-auto">
              Plataforma escalable, sobria y de alto rendimiento. Gestiona
              conferencias, centros de convenciones y espacios premium con
              autenticación, centralizado y emisión de reservas.
            </p>

            {/* Primary CTA Button: Reservar boletos -> Starts the booking flow (or opens login modal first) */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleReserveClick}
                className="px-8 py-3.5 bg-[#C7AA78] hover:bg-[#d5bd92] text-[#1b1c20] font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-[#C7AA78]/20 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <span>Reservar boletos</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Películas en Cartelera (/api/catalog/movies) replacing the old static cards */}
          <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C7AA78]/15 border border-[#C7AA78]/30 flex items-center justify-center text-[#C7AA78]">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Películas en Cartelera
                  </h2>
                  <p className="text-xs text-[#F2F0EB]/60">
                    Explora los últimos estrenos disponibles en EventCore
                  </p>
                </div>
              </div>
            </div>

            {isLoadingMovies ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#F2F0EB]/70">
                <Loader2 className="w-8 h-8 text-[#C7AA78] animate-spin" />
                <span className="text-sm">Cargando películas del catálogo...</span>
              </div>
            ) : moviesError ? (
              <div className="bg-[#222429]/90 border border-white/10 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#C7AA78]/10 border border-[#C7AA78]/30 text-[#C7AA78] flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <p className="text-sm text-[#F2F0EB]/80">{moviesError}</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="bg-[#222429]/90 border border-white/10 rounded-3xl p-8 text-center text-sm text-[#F2F0EB]/65">
                No hay películas publicadas en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="group bg-[#222429]/95 border border-white/10 hover:border-[#C7AA78]/50 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
                  >
                    {/* Clickable Movie Poster -> Opens MovieDetail (/peliculas/:id) in a new tab */}
                    <a
                      href={`/peliculas/${movie.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Ver más información de ${movie.title}`}
                      className="relative h-56 w-full overflow-hidden bg-[#141518] block cursor-pointer"
                    >
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#222429] via-transparent to-black/30" />

                      {/* Classification / Rating Badge */}
                      <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-lg bg-[#1b1c20]/90 backdrop-blur-md border border-[#C7AA78]/40 text-[#C7AA78] text-xs font-extrabold">
                        {movie.ageRating}
                      </span>

                      {/* Status Badge */}
                      <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-lg bg-[#C7AA78] text-[#1b1c20] text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                        {movie.genre}
                      </span>
                    </a>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-2.5">
                        <h3 className="text-lg font-extrabold text-white leading-snug group-hover:text-[#C7AA78] transition-colors">
                          {movie.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-[#F2F0EB]/70 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#C7AA78]" />
                            {movie.duration}
                          </span>
                          <span>&bull;</span>
                          <span>Clasificación {movie.ageRating}</span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#F2F0EB]/65 leading-relaxed line-clamp-3">
                          {movie.synopsis}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectMovieCard(movie)}
                        className="w-full py-3 px-4 rounded-xl bg-[#C7AA78] hover:bg-[#d5bd92] text-[#1b1c20] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C7AA78]/15 transition-all cursor-pointer"
                      >
                        <span>Ver horarios</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-[#777777]">
        <p>
          EventCore © {new Date().getFullYear()} — Aplicaciones Dedicadas —
          UNIBE
        </p>
      </footer>

      {/* Login Modal when clicking "Reservar boletos" while unauthenticated */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
};
