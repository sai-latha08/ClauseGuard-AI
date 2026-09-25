import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';
import { LayoutDashboard, UploadCloud, LogOut, FileText, Sparkles, Bot, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-50/95 backdrop-blur-md border-b border-cream-300/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo size="md" />

        <nav className="flex items-center gap-1 sm:gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive('/dashboard')
                    ? 'bg-burgundy-100 text-burgundy-900 border border-burgundy-300 shadow-xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-200/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-burgundy-700" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link
                to="/ai-assistant"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive('/ai-assistant')
                    ? 'bg-purple-100 text-purple-950 border border-purple-300 shadow-xs'
                    : 'text-burgundy-900/70 hover:text-burgundy-950 hover:bg-cream-200/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span className="hidden sm:inline">AI Copilot</span>
              </Link>

              <Link
                to="/upload"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isActive('/upload')
                    ? 'bg-burgundy-900 text-cream-50 ring-2 ring-burgundy-500 shadow-md'
                    : 'bg-burgundy-800 text-cream-50 hover:bg-burgundy-900'
                }`}
              >
                <UploadCloud className="w-4 h-4 text-cream-200" />
                <span>Audit & Paste</span>
              </Link>

              <div className="h-5 w-px bg-cream-300 mx-1 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-burgundy-950">{user?.name}</span>
                  <span className="text-[11px] text-burgundy-900/60 truncate max-w-[120px]">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-burgundy-900/60 hover:text-burgundy-900 hover:bg-burgundy-100 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-burgundy-900 hover:text-burgundy-950 rounded-xl hover:bg-cream-200/70 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold text-cream-50 bg-burgundy-800 hover:bg-burgundy-900 rounded-xl shadow-sm transition-colors border border-burgundy-950"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
