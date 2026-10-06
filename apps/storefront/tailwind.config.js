/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sidebar
        sidebar: {
          DEFAULT: "#1e293b",
          hover: "#334155",
          active: "#0d9488",
          text: "#94a3b8",
          "text-active": "#ffffff",
        },
        // Backgrounds
        background: "#f1f5f9",
        surface: {
          DEFAULT: "#ffffff",
          hover: "#f8fafc",
        },
        // Accent - Teal
        accent: {
          DEFAULT: "#0d9488",
          hover: "#0f766e",
          light: "#ccfbf1",
          text: "#ffffff",
        },
        // Text
        "text-primary": "#0f172a",
        "text-secondary": "#64748b",
        "text-muted": "#94a3b8",
        // Borders
        border: {
          DEFAULT: "#e2e8f0",
          light: "#f1f5f9",
        },
        // Status
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      spacing: {
        sidebar: "280px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
}
