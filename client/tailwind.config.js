/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080B11",
        surface: {
          50: "#1A2234",
          100: "#131927",
          200: "#0F1420",
          300: "#0B0F18",
          border: "#1E293B",
          borderHover: "#334155",
        },
        primary: {
          DEFAULT: "#6366F1", // Indigo
          hover: "#4F46E5",
          light: "#818CF8",
          dim: "rgba(99, 102, 241, 0.12)",
        },
        accent: {
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          violet: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.25)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        "glow-rose": "0 0 25px -5px rgba(244, 63, 94, 0.25)",
        "glow-amber": "0 0 25px -5px rgba(245, 158, 11, 0.25)",
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "pulse-slow": "pulseSlow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
