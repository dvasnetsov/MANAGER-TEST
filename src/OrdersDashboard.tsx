// components/Header.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/orders", label: "Orders" },
    { path: "/users", label: "Users" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
        {/* Логотип и название */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-emerald-700">
            Manager Panel
          </span>
        </div>

        {/* Навигация */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  active
                    ? "bg-emerald-100 text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:text-emerald-600"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
