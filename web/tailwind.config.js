/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme: Teal + Warm Ivory
        // #176B65 (Deep Teal)
        // #25877C (Accent Teal)
        // #F7F5EF (Warm Ivory)
        // #242D2B (Deep Forest Charcoal)
        // #E7E2D8 (Light Sand / Border)
        teal: {
          deep: '#176B65',
          primary: '#176B65',
          accent: '#25877C',
          light: '#E6F3F1',
          hover: '#135752',
          50: '#F0F8F7',
          100: '#D6ECE9',
          200: '#B0DCD7',
          300: '#7EC4BC',
          400: '#4DAAA0',
          500: '#25877C',
          600: '#176B65',
          700: '#135752',
          800: '#104642',
          900: '#0C3532',
        },
        ivory: {
          warm: '#F7F5EF',
          light: '#FBF9F4',
          card: '#FFFFFF',
          sand: '#E7E2D8',
          border: '#E7E2D8',
          50: '#FCFBF8',
          100: '#F7F5EF',
          200: '#E7E2D8',
          300: '#D7D0C2',
        },
        charcoal: {
          DEFAULT: '#242D2B',
          text: '#242D2B',
          dark: '#18201E',
          muted: '#52605C',
          light: '#768581',
        },
        brand: {
          50: '#F0F8F7',
          100: '#D6ECE9',
          200: '#B0DCD7',
          300: '#7EC4BC',
          400: '#4DAAA0',
          500: '#25877C',
          600: '#176B65',
          700: '#135752',
          800: '#104642',
          900: '#0C3532',
        },
        // Map blue utilities smoothly to the teal palette
        blue: {
          50: '#F0F8F7',
          100: '#D6ECE9',
          200: '#B0DCD7',
          300: '#7EC4BC',
          400: '#4DAAA0',
          500: '#25877C',
          600: '#176B65',
          700: '#135752',
          800: '#104642',
          900: '#0C3532',
        },
        // Harmonize slate utilities with Warm Ivory and Charcoal
        slate: {
          50: '#F7F5EF',
          100: '#EFECE2',
          200: '#E7E2D8',
          300: '#D5CEC0',
          400: '#9DA8A4',
          500: '#6C7B77',
          600: '#4E5C58',
          700: '#384441',
          800: '#2C3533',
          900: '#242D2B',
          950: '#18201E',
        },
      },
    },
  },
  plugins: [],
};
