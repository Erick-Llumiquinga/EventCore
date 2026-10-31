import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Home } from "../pages/Home";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";
import { SelectMovie } from "../pages/SelectMovie";
import { SelectShowtime } from "../pages/SelectShowtime";
import { SelectSeats } from "../pages/SelectSeats";
import { CheckoutPayment } from "../pages/CheckoutPayment";
import { BookingConfirmed } from "../pages/BookingConfirmed";
import { ProtectedRoute } from "../components/ProtectedRoute";

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#141518] text-[#F2F0EB] flex flex-col font-sans selection:bg-[#C7AA78] selection:text-[#141518]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Main Landing with Full-Width Carousel */}
          <Route path="/" element={<Home />} />

          {/* 5 Individual Cinema Booking Screens */}
          <Route path="/peliculas" element={<SelectMovie />} />
          <Route path="/funcion" element={<SelectShowtime />} />
          <Route path="/asientos" element={<SelectSeats />} />
          <Route path="/pago" element={<CheckoutPayment />} />
          <Route path="/confirmacion" element={<BookingConfirmed />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};
