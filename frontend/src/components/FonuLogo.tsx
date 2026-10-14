import React from 'react';

interface FonuLogoProps {
  className?: string;
  size?: number;
}

export const FonuLogo: React.FC<FonuLogoProps> = ({ className = '', size = 36 }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-slate-950 p-2 border border-slate-800 shadow-sm transition ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Cart Handle */}
        <path
          d="M 6 10 L 12 10"
          stroke="#FACC15"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* The 'F' Vertical Spine & Cart Back */}
        <path
          d="M 12 10 L 15 34"
          stroke="#FACC15"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* The 'F' Top Horizontal Bar */}
        <path
          d="M 12 10 L 40 10 L 37 20"
          stroke="#FACC15"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* The 'F' Middle Crossbar */}
        <path
          d="M 13.5 20 L 32 20"
          stroke="#FACC15"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Basket Lower Rim & Slope - Neon Blue */}
        <path
          d="M 15 30 L 34 30 L 37 20"
          stroke="#00E5FF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Shopping Cart Left Wheel */}
        <circle cx="17" cy="39" r="3.5" fill="#FACC15" />
        <circle cx="17" cy="39" r="1.5" fill="#020617" />

        {/* Shopping Cart Right Wheel */}
        <circle cx="33" cy="39" r="3.5" fill="#00E5FF" />
        <circle cx="33" cy="39" r="1.5" fill="#020617" />
      </svg>
    </div>
  );
};

