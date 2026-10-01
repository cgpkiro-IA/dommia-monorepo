import React from 'react';
export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'accent' | 'dark';
    size?: 'sm' | 'md' | 'lg';
    dot?: boolean;
    pulse?: boolean;
    className?: string;
}
export declare const Badge: React.FC<BadgeProps>;
//# sourceMappingURL=Badge.d.ts.map