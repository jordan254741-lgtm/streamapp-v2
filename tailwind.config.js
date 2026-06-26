/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#ffffff",
        border: "#27272a",
        card: "#18181b",
        "card-foreground": "#ffffff",
        primary: "#ffffff",
        "primary-foreground": "#09090b",
        secondary: "#27272a",
        "secondary-foreground": "#ffffff",
        muted: "#27272a",
        "muted-foreground": "#a1a1aa",
        accent: "#27272a",
        "accent-foreground": "#ffffff",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
      },
    },
  },
  plugins: [],
}
