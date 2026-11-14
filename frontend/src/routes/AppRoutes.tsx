import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Home } from "../pages/Home";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";
import { SelectMovie } from "../pages/SelectMovie";
import { MovieDetail } from "../pages/MovieDetail";
import { SelectShowtime } from "../pages/SelectShowtime";
import { SelectSeats } from "../pages/SelectSeats";
import { CheckoutPayment } from "../pages/CheckoutPayment";
import { BookingConfirmed } from "../pages/BookingConfirmed";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AssistantChat } from "../components/AssistantChat";

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#141518] text-[#F2F0EB] flex flex-col font-sans selection:bg-[#C7AA78] selection:text-[#141518]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Main Landing with Full-Width Carousel & Public Movie Detail */}
          <Route path="/" element={<Home />} />
          <Route path="/peliculas/:id" element={<MovieDetail />} />

          {/* 5 Individual Cinema Booking Screens (Protected) */}
          <Route
            path="/peliculas"
            element={
              <ProtectedRoute>
                <SelectMovie />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funcion"
            element={
              <ProtectedRoute>
                <SelectShowtime />
              </ProtectedRoute>
            }
          />
          <Route
            path="/asientos"
            element={
              <ProtectedRoute>
                <SelectSeats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pago"
            element={
              <ProtectedRoute>
                <CheckoutPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/confirmacion"
            element={
              <ProtectedRoute>
                <BookingConfirmed />
              </ProtectedRoute>
            }
          />

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
      <AssistantChat />
    </div>
  );
};
