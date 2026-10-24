/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: { sans: ['"Be Vietnam Pro"', "system-ui", "sans-serif"] },
      colors: {
        brand: { 50: "#eff6ff", 100: "#dbeafe", 500: "#2563eb", 600: "#1d4ed8", 700: "#1e40af", 900: "#172554" },
        accent: { 500: "#f97316", 600: "#ea580c" },
      },
    },
  },
  plugins: [],
};
