export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  ageRating: string;
  rating: number;
  synopsis: string;
  poster: string;
  room: string;
}

export interface DateOption {
  id: string;
  dayName: string;
  dayNumber: string;
  month: string;
  formatted: string;
}

export const CINEMAS = [
  "Cine Centro Plaza",
  "Cine Paseo Real",
  "Cine Gran Estación",
];

export const MOVIES: Movie[] = [
  {
    id: "horizontes",
    title: "Horizontes",
    genre: "Ciencia ficción",
    duration: "120 min",
    ageRating: "+13",
    rating: 8.7,
    synopsis:
      "Un viaje épico a través de nuevos mundos, donde la esperanza nunca se apaga.",
    poster: "/images/horizontes.jpg",
    room: "Sala 1",
  },
  {
    id: "el-ultimo-bosque",
    title: "El Último Bosque",
    genre: "Aventura",
    duration: "110 min",
    ageRating: "Todo público",
    rating: 8.5,
    synopsis:
      "En el corazón de una reserva ancestral, un guardián descubre el secreto que conecta toda la vida en la Tierra.",
    poster: "/images/bosque.jpg",
    room: "Sala 2",
  },
  {
    id: "luz-interior",
    title: "Luz Interior",
    genre: "Drama",
    duration: "105 min",
    ageRating: "+13",
    rating: 8.9,
    synopsis:
      "Frente a un faro solitario en la costa del Atlántico, dos desconocidos reconstruyen sus recuerdos tras la tormenta.",
    poster: "/images/luz-interior.jpg",
    room: "Sala 3",
  },
  {
    id: "universo-vivo",
    title: "Universo Vivo",
    genre: "Documental",
    duration: "95 min",
    ageRating: "Todo público",
    rating: 8.6,
    synopsis:
      "Una inmersión cinematográfica por los confines del cosmos y el nacimiento de nuevas estrellas.",
    poster: "/images/universo-vivo.jpg",
    room: "Sala IMAX",
  },
];

export const DATES: DateOption[] = [
  { id: "2026-10-24", dayName: "Vie", dayNumber: "24", month: "Oct", formatted: "Vie, 24 oct." },
  { id: "2026-10-25", dayName: "Sáb", dayNumber: "25", month: "Oct", formatted: "Sáb, 25 oct." },
  { id: "2026-10-26", dayName: "Dom", dayNumber: "26", month: "Oct", formatted: "Dom, 26 oct." },
  { id: "2026-10-27", dayName: "Lun", dayNumber: "27", month: "Oct", formatted: "Lun, 27 oct." },
  { id: "2026-10-28", dayName: "Mar", dayNumber: "28", month: "Oct", formatted: "Mar, 28 oct." },
  { id: "2026-10-29", dayName: "Mié", dayNumber: "29", month: "Oct", formatted: "Mié, 29 oct." },
];

export const SHOWTIMES = ["14:30", "17:00", "19:45", "22:15"];

export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F"];
export const SEATS_PER_ROW = 8;

// Occupied seats matching the mockup visual layout
export const OCCUPIED_SEATS = new Set([
  "A3",
  "A6",
  "B4",
  "B7",
  "D2",
  "D5",
  "D6",
  "E4",
  "E7",
  "F2",
  "F5",
  "F6",
]);

export const TICKET_PRICE = 15.0;
export const DISCOUNT_TICKET_PRICE = TICKET_PRICE * 0.5; // 50% para Niño, 3ra Edad o Discapacidad


