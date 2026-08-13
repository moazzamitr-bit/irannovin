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
        brand: {
          red: "#C8102E",
          "red-dark": "#A50D25",
          "red-light": "#E8173A",
          black: "#0B0B0D",
          "dark-bg": "#111113",
          "light-bg": "#F7F7F5",
          primary: "#161616",
          secondary: "#6B6B6B",
          neutral: "#E9E6E1",
          white: "#FFFFFF",
        },
      },
      fontFamily: {
        persian: ["Vazirmatn", "IRANSansX", "Dana", "Tahoma", "Arial", "sans-serif"],
        latin: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["Vazirmatn", "Inter", "Helvetica Neue", "Arial", "sans-serif"],
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      fontSize: {
        "7xl": ["4.5rem", { lineHeight: "1.05" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "0.9" }],
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease forwards",
        "fade-in": "fadeIn 0.6s ease forwards",
        "slide-in-right": "slideInRight 0.8s ease forwards",
        "counter": "counter 2s ease forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern": "linear-gradient(135deg, #0B0B0D 0%, #1a0a0e 50%, #0B0B0D 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
