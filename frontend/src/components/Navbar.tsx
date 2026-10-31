import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Ticket, LogOut, CircleUserRound } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#18191c]/95 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#C7AA78] flex items-center justify-center text-[#1c1d21] shadow-md shadow-[#C7AA78]/20 group-hover:scale-105 transition-transform">
            <Ticket className="w-4 h-4 text-[#1c1d21]" />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#C7AA78]">
            Event<span className="text-white">Core</span>
          </span>
        </Link>

        {/* Right: User Account */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#222429] border border-white/10 hover:border-[#C7AA78]/50 transition-colors"
              >
                <span className="text-xs font-medium text-[#F2F0EB]">
                  {user.name}
                </span>
                <CircleUserRound className="w-5 h-5 text-[#F2F0EB]/80" />
              </Link>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 rounded-xl bg-[#222429] border border-white/10 hover:border-red-400/40 text-[#777777] hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#222429] border border-white/10 hover:border-[#C7AA78]/50 text-xs sm:text-sm font-medium text-[#F2F0EB]/85 hover:text-[#C7AA78] transition-colors"
            >
              <span>Mi cuenta</span>
              <CircleUserRound className="w-4 h-4 text-[#F2F0EB]/85" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
