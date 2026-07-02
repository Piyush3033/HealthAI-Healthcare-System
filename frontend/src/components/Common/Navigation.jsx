import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { LogOut, Menu, X, Users, FileText, Send } from 'lucide-react';
import { useState } from 'react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPlatform1 = location.pathname.startsWith('/platform1');
  const isPlatform2 = location.pathname.startsWith('/platform2');

  const navBgClass = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const linkClass = isDark
    ? 'hover:text-blue-400 hover:bg-gray-800'
    : 'hover:text-blue-600 hover:bg-gray-100';
  const activeLinkClass = isDark
    ? 'text-blue-400 bg-gray-800'
    : 'text-blue-600 bg-gray-100';

  const isActive = (path) => location.pathname.includes(path);

  if (!user) return null;

  return (
    <nav className={`border-b ${navBgClass} transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className={`text-2xl font-bold ${textClass}`}>
            <Link to="/">HealthAI</Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {isPlatform1 && (
              <>
                <Link
                  to="/platform1/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') ? activeLinkClass : linkClass
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/platform1/patients"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive('/patients') ? activeLinkClass : linkClass
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Patients
                </Link>
                <Link
                  to="/platform1/referrals"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive('/referrals') ? activeLinkClass : linkClass
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Referrals
                </Link>
              </>
            )}
            {isPlatform2 && (
              <>
                <Link
                  to="/platform2/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/dashboard') ? activeLinkClass : linkClass
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/platform2/records"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive('/records') ? activeLinkClass : linkClass
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Records
                </Link>
                <Link
                  to="/platform2/health-insights"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/health-insights') ? activeLinkClass : linkClass
                  }`}
                >
                  Health Insights
                </Link>
              </>
            )}
          </div>

          {/* Theme Toggle & User Menu */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className={`text-sm ${textClass}`}>{user.email}</div>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg border transition-colors ${
                isDark
                  ? 'border-gray-700 hover:bg-gray-800 text-red-400'
                  : 'border-gray-300 hover:bg-gray-100 text-red-600'
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2"
            >
              {isOpen ? (
                <X className={`w-6 h-6 ${textClass}`} />
              ) : (
                <Menu className={`w-6 h-6 ${textClass}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={`md:hidden pb-4 flex flex-col gap-2`}>
            {isPlatform1 && (
              <>
                <Link
                  to="/platform1/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium block ${
                    isActive('/dashboard') ? activeLinkClass : linkClass
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/platform1/patients"
                  className={`px-3 py-2 rounded-lg text-sm font-medium block ${
                    isActive('/patients') ? activeLinkClass : linkClass
                  }`}
                >
                  Patients
                </Link>
                <Link
                  to="/platform1/referrals"
                  className={`px-3 py-2 rounded-lg text-sm font-medium block ${
                    isActive('/referrals') ? activeLinkClass : linkClass
                  }`}
                >
                  Referrals
                </Link>
              </>
            )}
            {isPlatform2 && (
              <>
                <Link
                  to="/platform2/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium block ${
                    isActive('/dashboard') ? activeLinkClass : linkClass
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/platform2/records"
                  className={`px-3 py-2 rounded-lg text-sm font-medium block ${
                    isActive('/records') ? activeLinkClass : linkClass
                  }`}
                >
                  Records
                </Link>
                <Link
                  to="/platform2/health-insights"
                  className={`px-3 py-2 rounded-lg text-sm font-medium block ${
                    isActive('/health-insights') ? activeLinkClass : linkClass
                  }`}
                >
                  Health Insights
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
