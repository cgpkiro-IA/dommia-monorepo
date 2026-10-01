import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'auto',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 24,
    md: 36,
    lg: 48,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const textColor =
    variant === 'light'
      ? 'text-white'
      : variant === 'dark'
      ? 'text-slate-900'
      : 'text-slate-900 dark:text-white';

  const iconColor = '#2563EB'; // Royal Blue

  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Isotipo: D + Hogar + Nodo Digital */}
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Contorno de la letra D con techo de casa */}
        <path
          d="M8 8V40H26C34.8366 40 42 32.8366 42 24C42 15.1634 34.8366 8 26 8H8Z"
          className={
            variant === 'light'
              ? 'fill-white/20 stroke-white'
              : variant === 'dark'
              ? 'fill-slate-900/10 stroke-slate-900'
              : 'fill-slate-900/10 stroke-slate-900 dark:fill-white/20 dark:stroke-white'
          }
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Silueta de techo de hogar dentro de la D */}
        <path
          d="M16 26L24 18L32 26V34H16V26Z"
          fill={iconColor}
          stroke={iconColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Nodo digital conectado en el centro */}
        <circle cx="24" cy="27" r="3" fill="#FFFFFF" />
        {/* Pulso de conexión digital */}
        <circle cx="34" cy="14" r="2.5" fill={iconColor} />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold tracking-wider ${textSizes[size]} ${textColor} font-['Manrope'] transition-colors`}>
            DOMMIA
          </span>
          <span className="text-[9px] tracking-widest text-blue-600 font-semibold uppercase mt-0.5">
            Communities
          </span>
        </div>
      )}
    </div>
  );
};
