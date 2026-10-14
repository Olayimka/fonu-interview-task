import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FonuLogo } from './FonuLogo';
import {
  Shield,
  User as UserIcon,
  LogOut,
  ArrowRightLeft,
  ShoppingCart,
  Store,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onGoToHome: () => void;
  onGoToInventory: () => void;
  onGoToCart: () => void;
  currentView?: 'home' | 'inventory' | 'cart';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onGoToHome,
  onGoToInventory,
  onGoToCart,
  currentView = 'home',
}) => {
  const { user, logout, quickLoginAsAdmin, quickLoginAsCustomer } = useAuth();
  const { totalItems, isCartBouncing } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo: Yellow 'Fonu', Neon Blue 'Shop' */}
        <div
          onClick={onGoToHome}
          className="flex items-center space-x-3 cursor-pointer select-none group"
        >
          <FonuLogo size={38} />
          <div className="flex items-baseline space-x-1 font-black text-xl tracking-tight">
            <span className="text-[#EAB308]">
              Fonu
            </span>
            <span className="text-[#0284C7]">
              Shop
            </span>
          </div>
        </div>

        {/* Center / Navigation Links */}
        <div className="hidden sm:flex items-center space-x-1">
          <button
            onClick={onGoToHome}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              currentView === 'home'
                ? 'text-[#0284C7] bg-sky-50 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={onGoToInventory}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              currentView === 'inventory'
                ? 'text-[#0284C7] bg-sky-50 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store Inventory</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Cart Icon Button with dynamic badge */}
          <button
            onClick={onGoToCart}
            className={`relative p-2.5 rounded-xl border transition ${
              currentView === 'cart'
                ? 'bg-amber-50 border-amber-400 text-amber-600'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-[#0284C7] hover:border-sky-300 hover:bg-sky-50'
            } ${isCartBouncing ? 'scale-110 border-amber-400 text-amber-600' : ''}`}
            title="Shopping Cart"
            id="navbar-cart-button"
          >
            <ShoppingCart className="w-4 h-4" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-[18px] h-[18px] rounded-full bg-[#EAB308] text-slate-950 font-black text-[10px] flex items-center justify-center font-mono shadow-sm">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <>
              {/* User Account / Role Pill */}
              <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                {user.role === 'ADMIN' ? (
                  <span className="flex items-center text-amber-700 font-extrabold gap-1 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-lg text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    ADMIN
                  </span>
                ) : (
                  <span className="flex items-center text-sky-700 font-extrabold gap-1 bg-sky-100/70 border border-sky-300 px-2 py-0.5 rounded-lg text-[11px]">
                    <UserIcon className="w-3.5 h-3.5 text-sky-600" />
                    CUSTOMER
                  </span>
                )}
                <span className="text-slate-600 font-mono text-[11px] truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>

              {/* Role Switcher */}
              <div className="flex items-center space-x-1">
                {user.role === 'ADMIN' ? (
                  <button
                    onClick={quickLoginAsCustomer}
                    title="Switch to Customer account"
                    className="flex items-center text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 transition font-bold"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-sky-600" />
                    <span className="hidden sm:inline">Switch</span> Customer
                  </button>
                ) : (
                  <button
                    onClick={quickLoginAsAdmin}
                    title="Switch to Admin account"
                    className="flex items-center text-xs text-amber-900 hover:text-black bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-xl border border-amber-300 transition font-bold"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    <span className="hidden sm:inline">Switch</span> Admin
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={quickLoginAsCustomer}
                className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition hidden sm:inline-block font-semibold"
              >
                Customer Demo
              </button>
              <button
                onClick={quickLoginAsAdmin}
                className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1.5 rounded-xl transition hidden sm:inline-block font-bold"
              >
                Admin Demo
              </button>

              {/* Prominent, unmistakably visible Sign In button */}
              <button
                onClick={onOpenAuth}
                className="text-xs bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black px-4 py-2 rounded-xl shadow-sm border border-yellow-400 transition active:scale-95 flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

