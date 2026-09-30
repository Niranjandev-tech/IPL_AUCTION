/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        broadcast: {
          bg: '#000000',
          card: '#0a0a0a',
          surface: '#111111',
          elevated: '#161616',
          header: '#0d0d0d',
          accent: '#d4af37', // IPL Gold
          gold: '#ffd700',
          red: '#ff3366',
          green: '#00e676',
          darkBorder: '#262626',
        },
        franchise: {
          csk: '#ffcc00', // Chennai Super Kings Yellow
          mi: '#004ba0',  // Mumbai Indians Blue
          rcb: '#ec1c24', // Royal Challengers Bengaluru Red
          kkr: '#3a225d', // Kolkata Knight Riders Purple
          srh: '#f26522', // Sunrisers Hyderabad Orange
          dc: '#00008b',  // Delhi Capitals Blue
          rr: '#ea1a85',  // Rajasthan Royals Pink
          pbks: '#dd1f2d',// Punjab Kings Red
          lsg: '#0057b8', // Lucknow Super Giants Cyan/Blue
          gt: '#1b2133',  // Gujarat Titans Navy
        }
      },
      fontFamily: {
        heading: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'broadcast': '0 8px 32px 0 rgba(0, 0, 0, 0.9)',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.25)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gavel': 'gavelBounce 0.6s ease-in-out',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        gavelBounce: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '30%': { transform: 'rotate(-45deg)' },
          '60%': { transform: 'rotate(15deg)' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}

