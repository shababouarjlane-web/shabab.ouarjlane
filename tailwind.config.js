/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Thmanyah Serif Display"', 'serif'],
        thmanyah: ['"Thmanyah Serif Display"', 'serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sahara: {
          espresso: "#301809",
          umber: "#723c11",
          bronze: "#b87a29",
          gold: "#d4b174",
          amber: "#efa83f",
          sandstone: "#dbc397",
          champagne: "#fae1b7",
          parchment: "#fdfbf7",
          slate: "#84939c",
          slateLight: "#a3a8ac",
          silver: "#b8b7b5",
          stone: "#d2cfca",
          taupe: "#b8ab9c",
        },
      },
      boxShadow: {
        'glow-amber': '0 10px 30px -5px rgba(239, 168, 63, 0.4)',
        'glow-gold': '0 12px 35px -8px rgba(184, 122, 41, 0.3)',
        'glow-deep': '0 20px 40px -15px rgba(48, 24, 9, 0.25)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        }
      },
      animation: {
        blob: "blob 10s infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}