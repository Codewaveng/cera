/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#09090F',
        card: 'rgba(255,255,255,0.03)',
        'text-primary': '#F9FAFB',
        'text-secondary': '#6B7280',
        accent: {
          purple: '#7C3AED',
          blue: '#3B82F6',
        },
        success: '#10B981',
        danger: '#EF4444',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #7C3AED, #3B82F6)',
      },
      borderRadius: {
        xl: '20px',
      },
    },
  },
  plugins: [],
}
