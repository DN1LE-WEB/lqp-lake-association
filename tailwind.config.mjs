/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#5C6B52',
          light: '#7C8C6E',
          pale: '#E8EDE3',
          mist: '#D5DDD0',
        },
        wheat: {
          DEFAULT: '#D4C5A0',
          light: '#EDE5D0',
          pale: '#F5F2EB',
        },
        prairie: {
          DEFAULT: '#52525B',
          dark: '#3F3F46',
        },
        rust: {
          DEFAULT: '#9A4A2A',
          light: '#B85C38',
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
