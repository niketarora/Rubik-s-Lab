import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

const Navbar = () => {
  const { user, signOut, setMockRole } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="h-[64px] bg-surface border-b border-subtle px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 select-none">
      {/* Left: Brand block */}
      <div className="flex items-center gap-3">
        {/* Logomark - 2x2 minimal cube face */}
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-none">
          <div className="w-[32px] h-[32px] rounded-[8px] overflow-hidden grid grid-cols-2 grid-rows-2 flex-shrink-0 border border-subtle">
            <div className="bg-cube-red"></div>
            <div className="bg-cube-blue"></div>
            <div className="bg-cube-green"></div>
            <div className="bg-cube-yellow"></div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans text-[15px] font-extrabold tracking-tight text-primary">
              RUBIK'S LAB
            </span>
            <span className="font-mono text-[9px] text-accent-blue mt-0.5 font-mono">
              v1.2.0-beta
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Main Navigation */}
      <div className="hidden md:flex items-center gap-[32px]">
        <NavLink
          to="/solve"
          className={({ isActive }) =>
            `text-[14px] font-semibold font-sans transition-colors ${
              isActive ? 'text-accent-blue' : 'text-secondary hover:text-primary'
            }`
          }
        >
          Solve
        </NavLink>
        <NavLink
          to="/compare"
          className={({ isActive }) =>
            `text-[14px] font-semibold font-sans transition-colors ${
              isActive ? 'text-accent-blue' : 'text-secondary hover:text-primary'
            }`
          }
        >
          Compare
        </NavLink>
        <NavLink
          to="/docs"
          className={({ isActive }) =>
            `text-[14px] font-semibold font-sans transition-colors ${
              isActive ? 'text-accent-blue' : 'text-secondary hover:text-primary'
            }`
          }
        >
          Learn
        </NavLink>

        {user && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-[14px] font-semibold font-sans transition-colors ${
                  isActive ? 'text-accent-blue' : 'text-secondary hover:text-primary'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `text-[14px] font-semibold font-sans transition-colors ${
                  isActive ? 'text-accent-blue' : 'text-secondary hover:text-primary'
                }`
              }
            >
              History
            </NavLink>
          </>
        )}

        {user && user.role === 'ADMIN' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-[14px] font-semibold font-sans transition-colors ${
                isActive ? 'text-accent-blue' : 'text-secondary hover:text-primary'
              }`
            }
          >
            Admin
          </NavLink>
        )}
      </div>

      {/* Right: Auth Controls / Avatar */}
      <div className="flex items-center gap-4">
        {/* Mock Role Switcher for easy testing during Phase 1 */}
        <div className="flex items-center bg-gray-100 rounded-btn p-0.5 border border-subtle text-[11px] font-semibold">
          <button
            onClick={() => setMockRole('GUEST')}
            className={`px-1.5 py-0.5 rounded-sm font-sans ${(!user || user.role === 'GUEST') ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
          >
            Guest
          </button>
          <button
            onClick={() => setMockRole('USER')}
            className={`px-1.5 py-0.5 rounded-sm font-sans ${(user && user.role === 'USER') ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
          >
            User
          </button>
          <button
            onClick={() => setMockRole('ADMIN')}
            className={`px-1.5 py-0.5 rounded-sm font-sans ${(user && user.role === 'ADMIN') ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
          >
            Admin
          </button>
        </div>

        {!user || user.role === 'GUEST' ? (
          <div className="flex items-center gap-4">
            <Link
              to="/auth/sign-in"
              className="text-[14px] font-semibold text-secondary hover:text-primary font-sans transition-colors"
            >
              Sign In
            </Link>
            <Button variant="primary-black" onClick={() => navigate('/auth/sign-up')}>
              Get Started
            </Button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full bg-accent-blue text-on-dark flex items-center justify-center font-bold text-[14px] select-none hover:bg-blue-700 transition-colors border border-subtle focus-visible:outline-2 focus-visible:outline-accent-blue"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-subtle rounded-card shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-subtle">
                  <p className="text-[13px] font-semibold text-primary font-sans truncate">{user.name}</p>
                  <p className="text-[11px] text-secondary font-mono truncate">{user.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-[13px] text-secondary hover:bg-gray-50 hover:text-primary font-sans"
                >
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-[13px] text-secondary hover:bg-gray-50 hover:text-primary font-sans"
                >
                  Solve History
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-[13px] text-accent-red hover:bg-gray-50 font-sans font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
