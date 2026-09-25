import React from 'react';
export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}
export declare const Badge: React.FC<BadgeProps>;
//# sourceMappingURL=Badge.d.ts.map