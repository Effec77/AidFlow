/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': 'var(--primary-bg)',
        'secondary-bg': 'var(--secondary-bg)',
        'text-color': 'var(--text-color)',
        'heading-color': 'var(--heading-color)',
        'brand-color': 'var(--brand-color)',
        'accent-color': 'var(--accent-color)',
        'button-bg': 'var(--button-bg)',
        'button-hover-bg': 'var(--button-hover-bg)',
        'card-bg': 'var(--card-bg)',
        'shadow-color': 'var(--shadow-color)',
      },
    },
  },
  plugins: [],
}
