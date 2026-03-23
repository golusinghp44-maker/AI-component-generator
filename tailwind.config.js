/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundColor: {
        'primary': 'var(--primary-bg)',
        'secondary': 'var(--secondary-bg)',
        'tertiary': 'var(--tertiary-bg)',
      },
      textColor: {
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'tertiary': 'var(--tertiary-bg)',
      },
      borderColor: {
        'primary': 'var(--border-color)',
      }
    },
  },
  plugins: [],
}