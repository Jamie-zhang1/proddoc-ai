import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4f46e5",
          foreground: "#ffffff",
          soft: "#eef2ff",
          muted: "#c7d2fe",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f8fafc",
          border: "#e2e8f0",
        },
        copy: {
          title: "#0f172a",
          body: "#475569",
          subtle: "#94a3b8",
        },
        status: {
          success: "#10b981",
          warning: "#f59e0b",
          error: "#f43f5e",
        },
      },
      boxShadow: {
        soft: "0 16px 40px -28px rgb(15 23 42 / 0.45)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
};

export default config;
