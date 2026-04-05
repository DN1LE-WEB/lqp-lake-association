/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        lake: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36adf8',
          500: '#0c93e9',
          600: '#0074c7',
          700: '#015da1',
          800: '#064f85',
          900: '#0b426e',
          950: '#072a49',
        },
        forest: {
          50: '#f0fdf1',
          100: '#dcfce0',
          200: '#bbf7c2',
          300: '#86ef95',
          400: '#4ade60',
          500: '#22c53e',
          600: '#16a32e',
          700: '#158028',
          800: '#166524',
          900: '#145320',
          950: '#052e0f',
        },
        sand: {
          50: '#faf8f1',
          100: '#f3efde',
          200: '#e6dcbb',
          300: '#d6c591',
          400: '#c7ab6a',
          500: '#bc964f',
          600: '#a67c42',
          700: '#8a6238',
          800: '#714f33',
          900: '#5e422d',
          950: '#352216',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
