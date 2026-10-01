"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Badge = ({ children, variant = 'neutral', size = 'md', dot = false, pulse = false, className = '', }) => {
    const base = 'inline-flex items-center font-semibold rounded-full select-none gap-1.5 transition-all';
    const sizeStyles = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-xs font-bold',
    };
    const variantStyles = {
        success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
        warning: 'bg-amber-50 text-amber-900 border border-amber-200/80',
        error: 'bg-rose-50 text-rose-800 border border-rose-200/80',
        info: 'bg-blue-50 text-blue-800 border border-blue-200/80',
        neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
        accent: 'bg-cyan-50 text-cyan-800 border border-cyan-200/80',
        dark: 'bg-slate-900 text-slate-200 border border-slate-700',
    };
    const dotColors = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        error: 'bg-rose-500',
        info: 'bg-blue-500',
        neutral: 'bg-slate-400',
        accent: 'bg-cyan-500',
        dark: 'bg-emerald-400',
    };
    return ((0, jsx_runtime_1.jsxs)("span", { className: `${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`, children: [dot && ((0, jsx_runtime_1.jsxs)("span", { className: "relative flex h-1.5 w-1.5", children: [pulse && ((0, jsx_runtime_1.jsx)("span", { className: `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}` })), (0, jsx_runtime_1.jsx)("span", { className: `relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}` })] })), children] }));
};
exports.Badge = Badge;
//# sourceMappingURL=Badge.js.map