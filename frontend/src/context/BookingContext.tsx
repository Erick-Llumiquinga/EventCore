import React, { createContext, useContext, useState } from "react";
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

interface BookingContextType {
  selectedCinema: string;
  setSelectedCinema: (cinema: string) => void;
  selectedMovie: Movie;
  setSelectedMovie: (movie: Movie) => void;
  selectedDate: DateOption;
  setSelectedDate: (date: DateOption) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
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
  bookingCode: string;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCinema, setSelectedCinema] = useState<string>(CINEMAS[0]);
  const [selectedMovie, setSelectedMovie] = useState<Movie>(MOVIES[0]);
  const [selectedDate, setSelectedDate] = useState<DateOption>(DATES[1]); // Sáb 25 Oct
  const [selectedTime, setSelectedTime] = useState<string>(SHOWTIMES[1]); // 17:00

  // Ticket quantities chosen in Step 2 (default 0)
  const [adultTickets, setAdultTicketsState] = useState<number>(0);
  const [discountTickets, setDiscountTicketsState] = useState<number>(0);

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookingCode] = useState<string>("EC-784523");

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
        // Replace the first selected seat with the newly chosen seat
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
  };

  const totalPrice =
    adultTickets * TICKET_PRICE + discountTickets * DISCOUNT_TICKET_PRICE;

  return (
    <BookingContext.Provider
      value={{
        selectedCinema,
        setSelectedCinema,
        selectedMovie,
        setSelectedMovie,
        selectedDate,
        setSelectedDate,
        selectedTime,
        setSelectedTime,
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
        bookingCode,
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
