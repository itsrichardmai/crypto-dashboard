'use client';

import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = (
    <>
      <Link
        href={user ? "/dashboard" : "/"}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          isActive('/dashboard')
            ? 'bg-white/20 text-white'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        Dashboard
      </Link>
      <Link
        href="/portfolio"
        className={`px-4 py-2 rounded-lg font-medium transition ${
          isActive('/portfolio')
            ? 'bg-white/20 text-white'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        Portfolio
      </Link>
    </>
  );

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-white">CryptoDash</span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              {navLinks}
              <div className="h-6 w-px bg-white/30 mx-2" />
              <span className="text-white/80 text-sm">{user.email}</span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
              >
                Sign Out
              </Button>
            </div>
          )}

          {/* Mobile Hamburger */}
          {user && (
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {user && mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 py-4 space-y-2">
            {navLinks}
            <div className="pt-4 border-t border-white/20 space-y-2">
              <div className="text-white/80 text-sm px-4">{user.email}</div>
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
