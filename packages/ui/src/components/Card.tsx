import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: 'none' | 'sm' | 'md' | 'hover';
}

export const Card: React.FC<CardProps> = ({
  children,
  elevation = 'sm',
  className = '',
  ...props
}) => {
  const elevations = {
    none: 'border border-slate-200',
    sm: 'border border-slate-200/80 shadow-xs hover:border-slate-300',
    md: 'border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow',
    hover: 'border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 text-slate-800 ${elevations[elevation]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
