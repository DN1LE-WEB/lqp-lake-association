/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#3D7A68',
          light: '#6BB8A5',
          pale: '#EDF5F2',
          border: '#C8DDD6',
        },
        prairie: {
          DEFAULT: '#52525B',
          dark: '#3F3F46',
        },
        rust: {
          DEFAULT: '#8B4A2A',
        },
        navy: {
          DEFAULT: '#0F1B2D',
          light: '#0B1524',
        },
      },
      fontFamily: {
        display: ['"Zilla Slab"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
