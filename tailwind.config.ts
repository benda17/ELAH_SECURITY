import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a1024",
          panel: "#0f1733",
          subtle: "#131c3d",
          elevated: "#172145",
        },
        ink: {
          DEFAULT: "#e7ecf7",
          muted: "#94a0c2",
          subtle: "#6b7799",
        },
        accent: {
          gold: "#d4af6a",
          emerald: "#34d399",
          cyan: "#22d3ee",
          rose: "#fb7185",
          amber: "#fbbf24",
        },
        line: {
          DEFAULT: "#1f2a52",
          strong: "#2b376a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
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
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px -12px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(212,175,106,0.25), 0 8px 32px -8px rgba(212,175,106,0.25)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.1rem",
      },
    },
  },
  plugins: [],
};

export default config;
