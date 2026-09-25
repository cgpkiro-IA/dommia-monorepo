"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Badge = ({ children, variant = 'neutral', size = 'md', className = '', }) => {
    const base = 'inline-flex items-center font-semibold rounded-full select-none';
    const sizeStyles = {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
    };
    const variantStyles = {
        success: 'bg-[#ECFDF5] text-[#065F46] border border-emerald-200',
        warning: 'bg-[#FFFBEB] text-[#92400E] border border-amber-200',
        error: 'bg-[#FEF2F2] text-[#991B1B] border border-red-200',
        info: 'bg-[#EFF6FF] text-[#1E40AF] border border-blue-200',
        neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    };
    return ((0, jsx_runtime_1.jsx)("span", { className: `${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`, children: children }));
};
exports.Badge = Badge;
//# sourceMappingURL=Badge.js.map