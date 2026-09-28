const sharedConfig = require('@dommia/config-tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedConfig],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
