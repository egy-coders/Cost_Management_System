/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#111827",
        concrete: "#6b7280",
        site: "#a30f17",
        steel: "#64748b",
        caution: "#b45309"
      }
    }
  },
  plugins: []
};
