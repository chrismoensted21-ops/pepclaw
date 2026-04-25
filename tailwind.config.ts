import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1480px" },
    },
    extend: {
      colors: {
        ink: {
          50: "#f5f3ff",
          100: "#ddd6fe",
          200: "#a195c4",
          300: "#7c6f97",
          400: "#574b6e",
          500: "#3d3252",
          600: "#2a2238",
          700: "#1a1525",
          800: "#100b1a",
          900: "#08050f",
          950: "#040208",
        },
        plum: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        signal: {
          live: "#a78bfa",
          warn: "#f0abfc",
          err: "#fb7185",
          info: "#7dd3fc",
        },
        border: "rgb(167 139 250 / 0.10)",
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        widest: "0.18em",
      },
      boxShadow: {
        panel:
          "0 1px 0 rgba(167,139,250,0.05) inset, 0 0 0 1px rgba(167,139,250,0.06), 0 30px 80px -40px rgba(0,0,0,0.8)",
        glow: "0 0 40px -8px rgba(124,58,237,0.45)",
        glowSoft: "0 0 60px -10px rgba(124,58,237,0.30)",
        innerHair:
          "inset 0 1px 0 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(167,139,250,0.06)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)",
        "radial-plum":
          "radial-gradient(ellipse at top, rgba(124,58,237,0.12), transparent 60%)",
      },
      animation: {
        "pulse-soft": "pulseSoft 3.5s ease-in-out infinite",
        scan: "scan 6s linear infinite",
        float: "float 8s ease-in-out infinite",
        "fade-up": "fadeUp .8s cubic-bezier(.2,.7,.2,1) forwards",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
