import React from 'react';

interface DealerSocketLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withGlow?: boolean;
}

export const DealerSocketLogo: React.FC<DealerSocketLogoProps> = ({
  size = 'md',
  className = '',
  withGlow = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const iconSize = {
    sm: 28,
    md: 32,
    lg: 40,
    xl: 48,
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${
        withGlow ? 'drop-shadow-[0_4px_14px_rgba(15,23,42,0.4)]' : ''
      } ${className}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="ds-grad-primary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e293b" />
            <stop offset="0.5" stopColor="#0f172a" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="ds-grad-accent" x1="12" y1="10" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94a3b8" />
            <stop offset="1" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="ds-grad-surface" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Container with Precision Bevel */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="11"
          fill="url(#ds-grad-primary)"
          stroke="#334155"
          strokeWidth="1.25"
        />

        {/* Gloss highlight */}
        <rect
          x="3"
          y="3"
          width="42"
          height="21"
          rx="11"
          fill="url(#ds-grad-surface)"
        />

        {/* Automotive Gauge Arc / Connected Velocity Track */}
        <path
          d="M13 31C11.5 28.5 11 22.5 11 22.5C11 15.6 16.6 10 23.5 10C30.4 10 36 15.6 36 22.5C36 25.5 35.5 28.5 34 31"
          stroke="url(#ds-grad-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* DealerSocket Dynamic Speed Notch & Center Pin */}
        <path
          d="M20 18L26.5 24.5L34 16.5"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Precision Pivot Ring */}
        <circle cx="23.5" cy="27.5" r="4" fill="#FFFFFF" />
        <circle cx="23.5" cy="27.5" r="2" fill="#0f172a" />

        {/* Automotive Pulse Dots */}
        <circle cx="14" cy="33" r="1.75" fill="#64748b" />
        <circle cx="33" cy="33" r="1.75" fill="#64748b" />
      </svg>
    </div>
  );
};
