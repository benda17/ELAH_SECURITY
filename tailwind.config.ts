import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#e8eef6",
          muted: "#9aa7bd",
          dim: "#6b7689",
        },
        surface: {
          base: "#060b16",
          DEFAULT: "#0b1220",
          raised: "#111a2c",
          subtle: "#152036",
          border: "#1f2b45",
        },
        accent: {
          cyan: "#22d3ee",
          gold: "#f6c453",
          violet: "#a78bfa",
          rose: "#fb7185",
          emerald: "#34d399",
          amber: "#fbbf24",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
