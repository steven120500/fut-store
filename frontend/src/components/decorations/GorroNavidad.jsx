import React from "react";

// Gorro de Santa para poner encima del logo. El padre debe ser `relative`.
export default function GorroNavidad({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 52"
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)] ${className}`}
    >
      <defs>
        <linearGradient id="gorro-rojo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      <g transform="translate(64 0) scale(-1 1)">
      {/* cuerpo */}
      <path d="M8 40 C10 22 22 6 40 6 C50 6 56 12 58 20 C52 16 46 17 44 22 C48 28 50 34 52 40 Z" fill="url(#gorro-rojo)" />
      {/* borde de peluche */}
      <rect x="4" y="36" width="52" height="12" rx="6" fill="#f8fafc" />
      <rect x="4" y="36" width="52" height="4" rx="2" fill="#e2e8f0" opacity="0.6" />
      {/* pompón */}
      <circle cx="56" cy="22" r="6.5" fill="#f8fafc" />
      <circle cx="54.5" cy="20.5" r="2" fill="#fff" />
      </g>
    </svg>
  );
}
