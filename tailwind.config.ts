import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0a0c0d",
          900: "#101314",
          850: "#15181a",
          800: "#1b1f21",
          700: "#25292c",
          600: "#33393c",
          500: "#4a5256",
        },
        accent: {
          orange: "#de9b35",
          gold: "#c9a04a",
        },
        state: {
          correct: "#4c9a4c",
          "correct-fg": "#eafbea",
          partial: "#c9a227",
          "partial-fg": "#fdf6dd",
          incorrect: "#a33b3b",
          "incorrect-fg": "#fbe9e9",
        },
        rarity: {
          consumer: "#b0c3d9",
          industrial: "#5e98d9",
          milspec: "#4b69ff",
          restricted: "#8847ff",
          classified: "#d32ce6",
          covert: "#eb4b4b",
          extraordinary: "#e4ae39",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Narrow", "sans-serif"],
        body: ["var(--font-body)", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "monospace"],
      },
      backgroundImage: {
        noise: "url('/textures/noise.svg')",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)",
      },
      keyframes: {
        "flip-reveal": {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "flip-reveal": "flip-reveal 0.4s ease-in-out",
        "pop-in": "pop-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
