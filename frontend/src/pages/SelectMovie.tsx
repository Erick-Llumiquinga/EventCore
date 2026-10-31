import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronDown, Clock, Star } from "lucide-react";
import { CINEMAS, MOVIES, type Movie } from "../data/mockCinema";
import { useBooking } from "../context/BookingContext";

export const SelectMovie: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCinema, setSelectedCinema, setSelectedMovie } = useBooking();

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    navigate("/funcion");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Step Header Badge */}
      <div className="flex items-center gap-3 mb-5">
        <span className="w-7 h-7 rounded-full bg-[#C7AA78] text-[#1c1d21] font-extrabold text-sm flex items-center justify-center shadow-md shadow-[#C7AA78]/20">
          1
        </span>
        <h2 className="text-lg font-bold text-[#FFFFFF] tracking-tight">
          Elegir película
        </h2>
      </div>

      {/* Main Screen Card Container */}
      <div className="bg-[#1b1c20] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Hero Banner */}
        <div className="relative min-h-[260px] sm:min-h-[290px] flex items-center px-6 sm:px-10 py-8 overflow-hidden border-b border-white/5 bg-[#141518]">
          {/* Background image (cinema seats & popcorn on right without duplicate text) */}
          <div className="absolute inset-y-0 right-0 w-full sm:w-3/5 overflow-hidden">
            <img
              src="/images/hero-popcorn.jpg"
              alt="EventCore Cinema"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141518] via-[#141518]/40 to-transparent" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b1c20] via-transparent to-black/30" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-lg space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Encuentra tu
              <br />
              próxima película
            </h1>
            <p className="text-sm sm:text-base text-[#F2F0EB]/75 font-medium">
              Vive la mejor experiencia en EventCore
            </p>

            {/* Cinema Dropdown Selector */}
            <div className="pt-2">
              <div className="relative inline-block w-full sm:w-72">
                <MapPin className="w-4 h-4 text-[#C7AA78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCinema}
                  onChange={(e) => setSelectedCinema(e.target.value)}
                  className="w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl bg-[#18191c]/90 backdrop-blur-md border border-white/15 text-sm text-[#F2F0EB] font-medium focus:outline-none focus:border-[#C7AA78] transition-colors cursor-pointer"
                >
                  {CINEMAS.map((cinema) => (
                    <option
                      key={cinema}
                      value={cinema}
                      className="bg-[#202124] text-[#F2F0EB]"
                    >
                      {cinema}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#F2F0EB]/60 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MOVIES.map((movie) => (
              <div
                key={movie.id}
                className="group bg-[#24262b] border border-white/10 hover:border-[#C7AA78]/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
              >
                {/* Poster */}
                <div className="relative aspect-[4/4.2] w-full overflow-hidden bg-[#18191c]">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24262b] via-transparent to-transparent opacity-60" />
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-[#F2F0EB]/60 font-medium">
                      {movie.genre}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-[#F2F0EB]/70 pt-1">
                      <Clock className="w-3.5 h-3.5 text-[#F2F0EB]/50" />
                      <span>{movie.duration}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Star className="w-3.5 h-3.5 fill-[#E5A93C] text-[#E5A93C]" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectMovie(movie)}
                    className="w-full py-2.5 px-4 rounded-full bg-[#C7AA78] hover:bg-[#d5bd92] text-[#1c1d21] font-bold text-xs tracking-wide transition-all shadow-md shadow-[#C7AA78]/15 cursor-pointer"
                  >
                    Ver horarios
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
