import React from 'react';

interface CoficabLogoProps {
  height?: number;
  showTagline?: boolean;
  themeMode?: 'light' | 'dark';
}

export const CoficabLogo: React.FC<CoficabLogoProps> = ({
  height = 44,
  showTagline = true,
  themeMode
}) => {
  // If themeMode is not explicitly passed, detect data-theme on document root or default to light
  const isDark = themeMode === 'dark' || (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');

  const blueColor = isDark ? '#3b82f6' : '#002B90';
  const copperColor = isDark ? '#c98a4b' : '#b07238';
  const textMainColor = isDark ? '#ffffff' : '#002B90';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', userSelect: 'none' }}>
      <svg
        height={height}
        viewBox="0 0 280 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: `${height}px`, width: 'auto', overflow: 'visible' }}
      >
        {/* Concentric C Arcs */}
        {/* Outer Blue Arc */}
        <path
          d="M 45 10 A 35 35 0 1 0 45 80"
          stroke={blueColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Middle Copper/Bronze Arc */}
        <path
          d="M 42 22 A 23 23 0 1 0 42 68"
          stroke={copperColor}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner Blue Arc */}
        <path
          d="M 40 33 A 12 12 0 1 0 40 57"
          stroke={blueColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* COFICAB Brand Name */}
        <text
          x="58"
          y="52"
          fill={textMainColor}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="44"
          letterSpacing="1px"
        >
          COFICAB
        </text>

        {/* Tagline "Powered by Passion" */}
        {showTagline && (
          <>
            <text
              x="58"
              y="76"
              fill={isDark ? '#94a3b8' : '#002B90'}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="700"
              fontSize="14"
            >
              Powered by
            </text>
            <text
              x="142"
              y="76"
              fill={copperColor}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontStyle="italic"
              fontWeight="bold"
              fontSize="16"
            >
              Passion
            </text>
          </>
        )}
      </svg>
    </div>
  );
};
