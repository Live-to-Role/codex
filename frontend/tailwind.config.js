/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        codex: {
          olive: "#73704C",
          brown: "#595348",
          tan: "#D9D3C7",
          cream: "#F2F2F2",
          dark: "#402708",
          ink: "#332514",
        },
        primary: {
          50: "#FAF9F7",
          100: "#F2F0EB",
          200: "#E5E2D9",
          300: "#D9D3C7",
          400: "#A8A28A",
          500: "#73704C",
          600: "#595348",
          700: "#474236",
          800: "#332514",
          900: "#241A0E",
          950: "#1A1209",
        },
        accent: {
          400: "#8B8560",
          500: "#73704C",
          600: "#402708",
        },
      },
      fontFamily: {
        sans: [
          "Crimson Pro",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        serif: [
          "Crimson Pro",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        display: [
          "Cinzel",
          "ui-serif",
          "Georgia",
          "serif",
        ],
      },
      backgroundImage: {
        'parchment': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'tome': '0 4px 20px -2px rgba(51, 37, 20, 0.15), 0 2px 8px -2px rgba(51, 37, 20, 0.1)',
        'tome-lg': '0 10px 40px -4px rgba(51, 37, 20, 0.2), 0 4px 16px -4px rgba(51, 37, 20, 0.15)',
      },
    },
  },
  plugins: [],
};
