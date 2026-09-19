import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SyncPollLogo } from './SyncPollLogo';
import { Sun, Moon, BarChart3, PlusCircle, LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <header
        style={{
          margin: '16px auto',
          width: 'calc(100% - 32px)',
          maxWidth: '1240px',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          position: 'sticky',
          top: '16px',
          zIndex: 100,
          transition: 'all 0.25s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            minHeight: '64px',
          }}
        >
          {/* Brand Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <SyncPollLogo size={36} showText={true} />
          </Link>

          {/* Center Nav Links: Home */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
            }}
            className="navbar-links"
          >
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                fontSize: '15px',
                fontWeight: isHome ? '700' : '500',
                color: isHome ? 'var(--primary)' : 'var(--text-secondary)',
                position: 'relative',
                padding: '6px 0',
                transition: 'color 0.2s ease',
              }}
            >
              Home
              {isHome && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '2px',
                    borderRadius: '2px',
                    background: 'var(--primary)',
                  }}
                />
              )}
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Theme Toggle (Sun/Moon Pill) */}
            <button
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                width: '64px',
                height: '32px',
                borderRadius: '9999px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: theme === 'light' ? '4px' : '34px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--bg-card)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {theme === 'light' ? (
                  <Sun size={14} color="#f59e0b" />
                ) : (
                  <Moon size={14} color="#818cf8" />
                )}
              </div>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 4px' }}>
                <Sun size={12} color={theme === 'light' ? 'transparent' : 'var(--text-muted)'} />
                <Moon size={12} color={theme === 'dark' ? 'transparent' : 'var(--text-muted)'} />
              </div>
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  style={{
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <BarChart3 size={15} color="var(--primary)" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/create"
                  className="btn-pill-primary"
                  style={{ textDecoration: 'none', fontSize: '14px', padding: '8px 18px' }}
                >
                  <PlusCircle size={15} />
                  <span>Create Poll</span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '9999px',
                      background: 'var(--bg-secondary)',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <User size={14} color="var(--primary)" />
                    <span>{user?.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      padding: '7px 10px',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Log Out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Sign In Button (white/outline pill with cyan text) */}
                <Link
                  to="/login"
                  className="btn-pill-outline"
                  style={{ textDecoration: 'none', fontSize: '14px', padding: '8px 20px' }}
                >
                  Sign In
                </Link>

                {/* Get Started Button (solid cyan pill) */}
                <Link
                  to="/login?tab=register"
                  className="btn-pill-primary"
                  style={{ textDecoration: 'none', fontSize: '14px', padding: '8px 22px' }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
