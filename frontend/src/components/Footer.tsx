import React from 'react';
import { FonuLogo } from './FonuLogo';
import {
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Github,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo Sign: Yellow 'Fonu', Neon Blue 'Shop' */}
          <div className="flex items-center space-x-3">
            <FonuLogo size={36} />
            <div className="flex items-baseline space-x-1 font-black text-lg tracking-tight">
              <span className="text-[#EAB308]">Fonu</span>
              <span className="text-[#0284C7]">Shop</span>
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center space-x-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0284C7] hover:border-sky-300 transition"
              aria-label="Twitter / X"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-pink-600 hover:border-pink-300 transition"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0284C7] hover:border-sky-300 transition"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 transition"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>

          {/* Copyright notice */}
          <div className="text-slate-500 text-xs text-center sm:text-right font-medium">
            &copy; {new Date().getFullYear()} <span className="font-bold text-[#EAB308]">Fonu</span> <span className="font-bold text-[#0284C7]">Shop</span> Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

