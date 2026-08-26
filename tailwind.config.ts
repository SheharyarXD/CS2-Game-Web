import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Steam/CS:GO client steel-blue palette (the game's actual chrome
        // uses a dark navy gradient, not a neutral black), replacing the
        // earlier neutral "base" scale.
        steel: {
          950: "#0a0f16",
          900: "#0f1620",
          850: "#141d29",
          800: "#1a2532",
          750: "#20303f",
          700: "#263a4a",
          600: "#324c60",
          500: "#456075",
          400: "#5c7c92",
        },
        // Keep "base" as an alias of "steel" so any lingering references
        // during the reskin still resolve to the new palette.
        base: {
          950: "#0a0f16",
          900: "#0f1620",
          850: "#141d29",
          800: "#1a2532",
          700: "#263a4a",
          600: "#324c60",
          500: "#456075",
        },
        accent: {
          blue: "#67c1f5",
          "blue-dim": "#4a7ea3",
          gold: "#d4af37",
          amber: "#e2a03f",
          orange: "#e2a03f",
        },
        // Palette sampled from the CS:GO main-menu reference: a desaturated
        // steel-blue backdrop, near-black navy panels, amber for the active
        // tab, and the Steam-store green for primary buttons.
        cs: {
          bg1: "#8c9ba6",
          bg2: "#5d707d",
          bg3: "#33454f",
          panel: "#16232c",
          panel2: "#1c2c37",
          panel3: "#233542",
          head: "#294050",
          bar1: "#3c4e5a",
          bar2: "#2a3946",
          barLine: "#1b262e",
          border: "#334855",
          amber: "#c8891f",
          amberLt: "#e3a83c",
          green: "#7aa93c",
          greenDk: "#587f28",
          tan: "#b8935a",
          text: "#cbd6de",
          dim: "#8b9daa",
          dim2: "#6b7c88",
          link: "#6fa8d4",
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
          contraband: "#e4ae39",
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
