import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CAROUSEL_SLIDES = [
  {
    id: 1,
    image: "/images/carousel/slide-1.jpg",
    alt: "Reserva tus entradas al instante - EventCore",
  },
  {
    id: 2,
    image: "/images/carousel/banner1.jpeg",
    alt: "Vive la experiencia del cine - EventCore",
  },
  {
    id: 3,
    image: "/images/carousel/banner2.jpeg",
    alt: "Estrenos y eventos exclusivos - EventCore",
  },
];

export const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

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

        {/* Hero Text & CTA Section */}
        <section className="relative pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#C7AA78]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#FFFFFF] mb-5 leading-tight">
              Gestión y Reserva de
              <br />
              Eventos con <span className="text-[#C7AA78]">EventCore</span>
            </h1>

            <p className="text-sm sm:text-base text-[#F2F0EB]/75 mb-9 leading-relaxed max-w-2xl mx-auto">
              Plataforma escalable, sobria y de alto rendimiento. Gestiona
              conferencias, centros de convenciones y espacios premium con
              autenticación, centralizado y emisión de reservas.
            </p>

            {/* Primary CTA Button: Reservar boletos -> Starts the booking flow */}
            <div className="flex items-center justify-center">
              <Link
                to="/peliculas"
                className="px-8 py-3.5 bg-[#C7AA78] hover:bg-[#d5bd92] text-[#1b1c20] font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-[#C7AA78]/20 transition-all flex items-center justify-center gap-2.5 group cursor-pointer"
              >
                <span>Reservar boletos</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            <div className="bg-[#222429]/90 border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#C7AA78]/10 text-[#C7AA78] flex items-center justify-center mb-4 border border-[#C7AA78]/25">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">
                Catálogo Inteligente
              </h3>
              <p className="text-xs sm:text-sm text-[#F2F0EB]/60 leading-relaxed">
                Exploración de eventos por fechas, categorías, aforos y
                disponibilidad inmediata con microservicios dedicados.
              </p>
            </div>

            <div className="bg-[#222429]/90 border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#C7AA78]/10 text-[#C7AA78] flex items-center justify-center mb-4 border border-[#C7AA78]/25">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">
                Reserva y Tickets
              </h3>
              <p className="text-xs sm:text-sm text-[#F2F0EB]/60 leading-relaxed">
                Emisión de boletos con códigos únicos, confirmaciones
                automáticas y control de accesos sin duplicidades.
              </p>
            </div>
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
    </div>
  );
};
