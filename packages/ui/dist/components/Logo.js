"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logo = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Logo = ({ size = 'md', variant = 'auto', showText = true, className = '', }) => {
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
    const textColor = variant === 'light'
        ? 'text-white'
        : variant === 'dark'
            ? 'text-slate-900'
            : 'text-slate-900 dark:text-white';
    const iconColor = '#2563EB'; // Royal Blue
    return ((0, jsx_runtime_1.jsxs)("div", { className: `inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`, children: [(0, jsx_runtime_1.jsxs)("svg", { width: iconSizes[size], height: iconSizes[size], viewBox: "0 0 48 48", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: "shrink-0", children: [(0, jsx_runtime_1.jsx)("path", { d: "M8 8V40H26C34.8366 40 42 32.8366 42 24C42 15.1634 34.8366 8 26 8H8Z", className: variant === 'light'
                            ? 'fill-white/20 stroke-white'
                            : variant === 'dark'
                                ? 'fill-slate-900/10 stroke-slate-900'
                                : 'fill-slate-900/10 stroke-slate-900 dark:fill-white/20 dark:stroke-white', strokeWidth: "3.5", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("path", { d: "M16 26L24 18L32 26V34H16V26Z", fill: iconColor, stroke: iconColor, strokeWidth: "2", strokeLinejoin: "round" }), (0, jsx_runtime_1.jsx)("circle", { cx: "24", cy: "27", r: "3", fill: "#FFFFFF" }), (0, jsx_runtime_1.jsx)("circle", { cx: "34", cy: "14", r: "2.5", fill: iconColor })] }), showText && ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col leading-none", children: [(0, jsx_runtime_1.jsx)("span", { className: `font-extrabold tracking-wider ${textSizes[size]} ${textColor} font-['Manrope'] transition-colors`, children: "DOMMIA" }), (0, jsx_runtime_1.jsx)("span", { className: "text-[9px] tracking-widest text-blue-600 font-semibold uppercase mt-0.5", children: "Communities" })] }))] }));
};
exports.Logo = Logo;
//# sourceMappingURL=Logo.js.map