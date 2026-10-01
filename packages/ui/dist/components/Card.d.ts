import React from 'react';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    elevation?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'hover' | 'glow-blue' | 'glow-emerald';
    variant?: 'white' | 'subtle' | 'dark' | 'glass' | 'glass-dark';
}
export declare const Card: React.FC<CardProps>;
//# sourceMappingURL=Card.d.ts.map