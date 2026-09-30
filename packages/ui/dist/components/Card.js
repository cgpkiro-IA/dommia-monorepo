"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Card = ({ children, elevation = 'sm', className = '', ...props }) => {
    const elevations = {
        none: 'border border-slate-200',
        sm: 'border border-slate-200/80 shadow-xs hover:border-slate-300',
        md: 'border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow',
        hover: 'border border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: `bg-white rounded-xl p-5 text-slate-800 ${elevations[elevation]} ${className}`, ...props, children: children }));
};
exports.Card = Card;
//# sourceMappingURL=Card.js.map