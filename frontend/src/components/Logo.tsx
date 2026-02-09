'use client';

interface LogoProps {
  /** Stroke color for the curved side lines */
  accentStroke?: string;
  /** Stroke color for the heart outline and M letter */
  mainStroke?: string;
  /** Width of the logo */
  width?: number | string;
  /** Height of the logo */
  height?: number | string;
  /** Additional CSS classes */
  className?: string;
}

export default function Logo({
  accentStroke = '#e07a5f',
  mainStroke = '#f5f5f0',
  width = 120,
  height = 100,
  className = '',
}: LogoProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
    >
      {/* Coral curved lines coming from sides */}
      <path
        d="M 5 85 Q 15 85 25 65 Q 35 45 45 40"
        stroke={accentStroke}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 115 85 Q 105 85 95 65 Q 85 45 75 40"
        stroke={accentStroke}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Heart outline */}
      <path
        d="M 60 30 C 45 15 20 20 25 45 C 30 65 60 85 60 85 C 60 85 90 65 95 45 C 100 20 75 15 60 30"
        stroke={mainStroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* M letter */}
      <path
        d="M 35 70 L 35 40 L 60 55 L 85 40 L 85 70"
        stroke={mainStroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Preset variants for convenience
export function LogoBlack(props: Omit<LogoProps, 'accentStroke' | 'mainStroke'>) {
  return <Logo {...props} accentStroke="#000000" mainStroke="#000000" />;
}

export function LogoWhite(props: Omit<LogoProps, 'accentStroke' | 'mainStroke'>) {
  return <Logo {...props} accentStroke="#ffffff" mainStroke="#ffffff" />;
}
