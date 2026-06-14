/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          darkBg: "#0f172a",     // slate-900 (deep background)
          cardBg: "#1e293b",     // slate-800 (panel background)
          accent: "#6366f1",     // indigo-500
          accentCyan: "#06b6d4", // cyan-500
          accentRed: "#ef4444",  // red-500
          textPrimary: "#f8fafc",// slate-50
          textSecondary: "#94a3b8" // slate-400
        }
      }
    },
  },
  plugins: [],
}
