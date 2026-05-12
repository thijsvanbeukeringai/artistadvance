import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5ed",
          100: "#ffe7d3",
          200: "#ffcaa6",
          300: "#ffa66e",
          400: "#ff7a3a",
          500: "#f25a1c",
          600: "#e34611",
          700: "#bc3510",
          800: "#952c14",
          900: "#782714",
        },
        ink: {
          900: "#0f1115",
          700: "#2a2f38",
          500: "#5b6370",
          400: "#8a92a0",
          300: "#b8bdc7",
          200: "#e3e6eb",
          100: "#f3f5f8",
          50: "#f8fafc",
        },
        ok: "#16a34a",
        warn: "#f59e0b",
        bad: "#dc2626",
        canvas: {
          deep: "#0A0A0F",
          mid: "#111118",
          charcoal: "#16161E",
        },
        neon: {
          amber: "#F97316",
          ember: "#FB923C",
          pulse: "#FDBA74",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,17,21,0.04), 0 8px 24px rgba(15,17,21,0.04)",
        "cta-glow": "0 0 24px rgba(249,115,22,0.35)",
        "card-glow": "0 0 0 1px rgba(249,115,22,0.5), 0 20px 60px rgba(249,115,22,0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
