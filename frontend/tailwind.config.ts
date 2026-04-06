import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF8",
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F4F0",
        },
        border: {
          DEFAULT: "rgba(0,0,0,0.08)",
          strong: "rgba(0,0,0,0.15)",
        },
        "text-primary": "#1A1A18",
        "text-secondary": "#6B6A65",
        "text-tertiary": "#9C9A92",
        accent: {
          DEFAULT: "#534AB7",
          bg: "#EEEDFE",
          text: "#3C3489",
        },
        teal: {
          DEFAULT: "#0F6E56",
          bg: "#E1F5EE",
          text: "#085041",
        },
        amber: {
          DEFAULT: "#854F0B",
          bg: "#FAEEDA",
          text: "#633806",
          dot: "#EF9F27",
        },
        green: {
          DEFAULT: "#3B6D11",
          bg: "#EAF3DE",
          text: "#27500A",
        },
        red: {
          DEFAULT: "#A32D2D",
          bg: "#FCEBEB",
        },
        coral: {
          DEFAULT: "#993C1D",
          bg: "#FAECE7",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
export default config;
