import React from 'react';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    elevation?: 'none' | 'sm' | 'md' | 'hover';
}
export declare const Card: React.FC<CardProps>;
//# sourceMappingURL=Card.d.ts.map