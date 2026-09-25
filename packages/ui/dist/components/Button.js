"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Button = ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', disabled, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';
    const sizeStyles = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2.5 gap-2',
        lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
    };
    const variantStyles = {
        primary: 'bg-[#2563EB] text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm active:scale-[0.98]',
        secondary: 'bg-[#0F172A] text-white hover:bg-slate-800 focus:ring-slate-900 shadow-sm active:scale-[0.98]',
        outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400 active:scale-[0.98]',
        'dark-outline': 'border border-slate-700 bg-slate-800/90 text-slate-100 hover:bg-slate-700 hover:text-white hover:border-slate-600 focus:ring-slate-500 shadow-sm active:scale-[0.98]',
        danger: 'bg-[#DC2626] text-white hover:bg-red-700 focus:ring-red-500 shadow-sm active:scale-[0.98]',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
    };
    return ((0, jsx_runtime_1.jsxs)("button", { className: `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`, disabled: disabled || isLoading, ...props, children: [isLoading && ((0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-current", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8H4z" })] })), children] }));
};
exports.Button = Button;
//# sourceMappingURL=Button.js.map