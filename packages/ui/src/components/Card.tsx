import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'hover' | 'glow-blue' | 'glow-emerald';
  variant?: 'white' | 'subtle' | 'dark' | 'glass' | 'glass-dark';
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'sm',
  variant = 'white',
  className = '',
  ...props
}) => {
  const elevations = {
    none: '',
    xs: 'shadow-2xs',
    sm: 'shadow-card',
    md: 'shadow-md',
    lg: 'shadow-xl',
    hover: 'shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200',
    'glow-blue': 'shadow-glow-blue',
    'glow-emerald': 'shadow-glow-emerald',
  };

  const variants = {
    white: 'bg-white border border-slate-200/80 text-slate-800',
    subtle: 'bg-slate-50/80 border border-slate-200 text-slate-800',
    dark: 'bg-slate-900/90 border border-slate-800 text-white',
    glass: 'bg-white/80 backdrop-blur-md border border-white/60 text-slate-800',
    'glass-dark': 'bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 text-white',
  };

  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-150 ${variants[variant]} ${elevations[elevation]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

