/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC", // Fintech Light Workspace
        surface: {
          50: "#FFFFFF",
          100: "#FFFFFF",
          200: "#F1F5F9",
          300: "#E2E8F0",
          border: "#E2E8F0",
          borderHover: "#CBD5E1",
          dark: "#0F172A",
          darkBorder: "#1E293B",
        },
        primary: {
          DEFAULT: "#2563EB", // Fintech Cobalt Blue
          hover: "#1D4ED8",
          light: "#3B82F6",
          dim: "#EFF6FF",
        },
        accent: {
          cyan: "#0284C7",
          emerald: "#059669",
          amber: "#D97706",
          rose: "#DC2626",
          violet: "#7C3AED",
          indigo: "#4F46E5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        cardHover: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(3px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};
