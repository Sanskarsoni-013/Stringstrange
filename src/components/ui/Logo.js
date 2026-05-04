import React from 'react';

export const ConstantinELogo = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ filter: 'drop-shadow(0 0 6px rgba(138,20,50,0.5))' }}
    >
      <defs>
        <linearGradient id="ceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c5304a" />
          <stop offset="50%" stopColor="#991b3a" />
          <stop offset="100%" stopColor="#2a0a1a" />
        </linearGradient>
        <filter id="ceGoo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
      {/* Liquid frame / tendril ring */}
      <ellipse cx="50" cy="50" rx="46" ry="46" fill="none" stroke="url(#ceGrad)" strokeWidth="2.5" opacity="0.6" />
      <ellipse cx="50" cy="50" rx="42" ry="42" fill="none" stroke="url(#ceGrad)" strokeWidth="0.8" opacity="0.3" />

      {/* C letter - liquid style */}
      <g filter="url(#ceGoo)" fill="url(#ceGrad)">
        <circle cx="38" cy="35" r="7" />
        <circle cx="30" cy="42" r="6" />
        <circle cx="28" cy="52" r="6.5" />
        <circle cx="32" cy="62" r="6" />
        <circle cx="40" cy="68" r="7" />
        <circle cx="35" cy="48" r="4" />
      </g>

      {/* E letter - liquid style */}
      <g filter="url(#ceGoo)" fill="url(#ceGrad)">
        {/* Vertical spine */}
        <circle cx="62" cy="35" r="5.5" />
        <circle cx="62" cy="45" r="5" />
        <circle cx="62" cy="55" r="5" />
        <circle cx="62" cy="65" r="5.5" />
        {/* Top bar */}
        <circle cx="72" cy="35" r="5" />
        <circle cx="80" cy="35" r="4.5" />
        {/* Middle bar */}
        <circle cx="72" cy="50" r="4.5" />
        <circle cx="79" cy="50" r="4" />
        {/* Bottom bar */}
        <circle cx="72" cy="65" r="5" />
        <circle cx="80" cy="65" r="4.5" />
      </g>

      {/* Small tendril dots for liquid feel */}
      <circle cx="20" cy="50" r="2" fill="#c5304a" opacity="0.4" />
      <circle cx="85" cy="40" r="1.5" fill="#c5304a" opacity="0.35" />
      <circle cx="80" cy="75" r="2" fill="#991b3a" opacity="0.3" />
      <circle cx="18" cy="65" r="1.5" fill="#991b3a" opacity="0.35" />
    </svg>
  );
};

export default ConstantinELogo;
