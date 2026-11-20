import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CINEMAS,
  DATES,
  type DateOption,
  DISCOUNT_TICKET_PRICE,
  MOVIES,
  type Movie,
  SHOWTIMES,
  TICKET_PRICE,
} from "../data/mockCinema";
import type { CatalogShowtimeDto } from "../api/catalog";
import type { ReservationDto } from "../api/booking";

interface BookingContextType {
  selectedCinema: string;
  setSelectedCinema: (cinema: string) => void;
  selectedCinemaId?: number;
  setSelectedCinemaId: (id?: number) => void;
  selectedMovie: Movie;
  setSelectedMovie: (movie: Movie) => void;
  selectedDate: DateOption;
  setSelectedDate: (date: DateOption) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  selectedShowtime: CatalogShowtimeDto | null;
  setSelectedShowtime: (showtime: CatalogShowtimeDto | null) => void;
  adultTickets: number;
  setAdultTickets: (count: number) => void;
  discountTickets: number;
  setDiscountTickets: (count: number) => void;
  totalTickets: number;
  selectedSeats: string[];
  setSelectedSeats: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSeat: (seatId: string) => boolean;
  resetBooking: () => void;
  totalPrice: number;
  ticketPrice: number;
  discountTicketPrice: number;
  bookingCode: string;
  currentReservation: ReservationDto | null;
  setCurrentReservation: (res: ReservationDto | null) => void;
}

interface PersistedBookingState {
  selectedCinema: string;
  selectedCinemaId?: number;
  selectedMovie: Movie;
  selectedDate: DateOption;
  selectedTime: string;
  selectedShowtime?: CatalogShowtimeDto | null;
  adultTickets: number;
  discountTickets: number;
  selectedSeats: string[];
  currentReservation?: ReservationDto | null;
}

const BOOKING_STORAGE_KEY = "eventcore_booking_state_v2";

function loadPersistedBooking(): Partial<PersistedBookingState> {
  try {
    const raw = sessionStorage.getItem(BOOKING_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedBookingState>) : {};
  } catch {
    return {};
  }
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initial = loadPersistedBooking();

  const [selectedCinema, setSelectedCinema] = useState<string>(
    initial.selectedCinema || CINEMAS[0],
  );
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | undefined>(
    initial.selectedCinemaId,
  );
  const [selectedMovie, setSelectedMovie] = useState<Movie>(
    initial.selectedMovie || MOVIES[0],
  );
  const [selectedDate, setSelectedDate] = useState<DateOption>(
    initial.selectedDate || DATES[1],
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    initial.selectedTime || SHOWTIMES[1],
  );
  const [selectedShowtime, setSelectedShowtime] = useState<CatalogShowtimeDto | null>(
    initial.selectedShowtime || null,
  );

  // Ticket quantities chosen in Step 2 (default 0)
  const [adultTickets, setAdultTicketsState] = useState<number>(
    initial.adultTickets ?? 0,
  );
  const [discountTickets, setDiscountTicketsState] = useState<number>(
    initial.discountTickets ?? 0,
  );

  const [selectedSeats, setSelectedSeats] = useState<string[]>(
    initial.selectedSeats || [],
  );

  const [currentReservation, setCurrentReservation] = useState<ReservationDto | null>(
    initial.currentReservation || null,
  );

  // Dynamic ticket prices from showtime ticket_types if available
  const ticketPrice = React.useMemo(() => {
    if (selectedShowtime?.ticket_types && selectedShowtime.ticket_types.length > 0) {
      const general = selectedShowtime.ticket_types.find((tt) =>
        /general|adult/i.test(tt.name),
      );
      if (general) return Number(general.price);
      return Number(selectedShowtime.ticket_types[0].price);
    }
    return TICKET_PRICE;
  }, [selectedShowtime]);

  const discountTicketPrice = React.useMemo(() => {
    if (selectedShowtime?.ticket_types && selectedShowtime.ticket_types.length > 1) {
      const disc = selectedShowtime.ticket_types.find((tt) =>
        /edad|niño|disc/i.test(tt.name),
      );
      if (disc) return Number(disc.price);
    }
    return selectedShowtime?.ticket_types?.length === 1
      ? Number(ticketPrice) * 0.5
      : DISCOUNT_TICKET_PRICE;
  }, [selectedShowtime, ticketPrice]);

  const bookingCode = currentReservation?.booking_code || "EC-784523";

  // Persist booking state across route changes and reloads
  useEffect(() => {
    try {
      const state: PersistedBookingState = {
        selectedCinema,
        selectedCinemaId,
        selectedMovie,
        selectedDate,
        selectedTime,
        selectedShowtime,
        adultTickets,
        discountTickets,
        selectedSeats,
        currentReservation,
      };
      sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [
    selectedCinema,
    selectedCinemaId,
    selectedMovie,
    selectedDate,
    selectedTime,
    selectedShowtime,
    adultTickets,
    discountTickets,
    selectedSeats,
    currentReservation,
  ]);

  const totalTickets = adultTickets + discountTickets;

  const syncSeatsWithLimit = (newTotal: number) => {
    setSelectedSeats((prev) =>
      prev.length > newTotal ? prev.slice(0, newTotal) : prev,
    );
  };

  const setAdultTickets = (count: number) => {
    const valid = Math.max(0, Math.min(15, count));
    setAdultTicketsState(valid);
    syncSeatsWithLimit(valid + discountTickets);
  };

  const setDiscountTickets = (count: number) => {
    const valid = Math.max(0, Math.min(15, count));
    setDiscountTicketsState(valid);
    syncSeatsWithLimit(adultTickets + valid);
  };

  // Toggles a seat; if limit is already reached, replaces the oldest selected seat smoothly
  const toggleSeat = (seatId: string): boolean => {
    if (totalTickets <= 0) return false;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId);
      }
      if (prev.length >= totalTickets) {
        return [...prev.slice(prev.length - totalTickets + 1), seatId];
      }
      return [...prev, seatId];
    });
    return true;
  };

  const resetBooking = () => {
    setAdultTicketsState(0);
    setDiscountTicketsState(0);
    setSelectedSeats([]);
    setSelectedShowtime(null);
    setCurrentReservation(null);
    sessionStorage.removeItem(BOOKING_STORAGE_KEY);
  };

  const totalPrice =
    adultTickets * ticketPrice + discountTickets * discountTicketPrice;

  return (
    <BookingContext.Provider
      value={{
        selectedCinema,
        setSelectedCinema,
        selectedCinemaId,
        setSelectedCinemaId,
        selectedMovie,
        setSelectedMovie,
        selectedDate,
        setSelectedDate,
        selectedTime,
        setSelectedTime,
        selectedShowtime,
        setSelectedShowtime,
        adultTickets,
        setAdultTickets,
        discountTickets,
        setDiscountTickets,
        totalTickets,
        selectedSeats,
        setSelectedSeats,
        toggleSeat,
        resetBooking,
        totalPrice,
        ticketPrice,
        discountTicketPrice,
        bookingCode,
        currentReservation,
        setCurrentReservation,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking debe usarse dentro de un BookingProvider");
  }
  return ctx;
};
