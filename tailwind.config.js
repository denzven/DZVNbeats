/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        studio: {
          950: "#09090b",
          900: "#121215",
          850: "#18181b",
          800: "#27272a",
          700: "#3f3f46",
          accent: "#ffffff",
          accentMuted: "#a1a1aa",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave-bar": "wave 1.2s ease-in-out infinite alternate",
        glow: "glow 4s ease-in-out infinite alternate",
        "spin-slow": "spin 4s linear infinite",
      },
      keyframes: {
        wave: {
          "0%": { height: "20%" },
          "100%": { height: "100%" },
        },
        glow: {
          "0%": { opacity: "0.4", filter: "blur(40px)" },
          "100%": { opacity: "0.8", filter: "blur(60px)" },
        },
      },
    },
  },
  plugins: [],
};
