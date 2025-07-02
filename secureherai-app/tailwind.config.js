/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#67082F", // SecureHer AI brand color
          50: "#FDF2F8",
          100: "#FCE7F3",
          200: "#FBCFE8",
          300: "#F9A8D4",
          400: "#F472B6",
          500: "#EC4899",
          600: "#DB2777",
          700: "#BE185D",
          800: "#9D174D",
          900: "#67082F",
          950: "#4C0519",
        },
        secondary: {
          DEFAULT: "#4F46E5", // Indigo
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        accent: "#10B981", // Emerald 500 for success states
        background: "#FFE4D6", // Light peach background
        surface: "#FFFFFF", // White cards/surfaces
        muted: "#6B7280", // Gray 500 for muted text
        foreground: "#111827", // Gray 900 for primary text
        border: "#E5E7EB", // Gray 200 for borders
        error: "#EF4444", // Red 500 for errors
        warning: "#F59E0B", // Amber 500 for warnings
        success: "#10B981", // Emerald 500 for success
        info: "#3B82F6", // Blue 500 for info
      },
      fontFamily: {
        sans: ["System", "ui-sans-serif", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        brand: "0 4px 14px 0 rgba(103, 8, 47, 0.15)",
        soft: "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
