/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Burgundy Palette
        burgundy: {
          50: '#FDF4F5',
          100: '#FCE7EA',
          200: '#F7CBD1',
          300: '#EE9FAA',
          400: '#E16C7E',
          500: '#CE3E55',
          600: '#B0263E',
          700: '#8F192E',
          800: '#751727',
          900: '#5A121E',
          950: '#3D0711',
        },
        // Warm Cream Palette
        cream: {
          50: '#FDFBF7',
          100: '#FAF6ED',
          200: '#F4ECE0',
          300: '#EBDEC8',
          400: '#E0CCAB',
          500: '#D1B487',
          600: '#BC9765',
          700: '#9E7849',
          800: '#80603A',
          900: '#694F32',
          950: '#3D2B1A',
        },
        // Brand aliases
        brand: {
          50: '#FDF4F5',
          100: '#FCE7EA',
          200: '#F7CBD1',
          300: '#EE9FAA',
          400: '#E16C7E',
          500: '#B0263E',
          600: '#8F192E',
          700: '#751727',
          800: '#5A121E',
          900: '#3D0711',
          950: '#2A040B',
        },
        navy: {
          800: '#5A121E',
          900: '#3D0711',
          950: '#2A040B',
        },
        risk: {
          low: '#15803D',
          lowBg: '#F0FDF4',
          lowBorder: '#BBF7D0',
          med: '#B45309',
          medBg: '#FFFBEB',
          medBorder: '#FDE68A',
          high: '#C2410C',
          highBg: '#FFF7ED',
          highBorder: '#FFEDD5',
          crit: '#991B1B',
          critBg: '#FEF2F2',
          critBorder: '#FECACA',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        legal: ['Merriweather', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
