/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#7C8C6E',
          light: '#A8B89A',
          pale: '#E8EDE3',
          mist: '#D5DDD0',
        },
        wheat: {
          DEFAULT: '#D4C5A0',
          light: '#EDE5D0',
          pale: '#FAF7F0',
        },
        prairie: {
          DEFAULT: '#8B8178',
          dark: '#5C554E',
        },
        bark: {
          DEFAULT: '#3D352E',
          deep: '#2A241F',
        },
        rust: {
          DEFAULT: '#B85C38',
          light: '#D4785A',
        },
        linen: '#FBF9F4',
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
