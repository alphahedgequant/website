/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0F1E",
        surface: "#101729",
        raised: "#161F36",
        line: "rgba(148,163,184,0.14)",
        body: "#E6EAF2",
        muted: "#8A94A8",
        amber: "#F0A93B",
        amberdim: "#B97F22",
        gain: "#2DD482",
        loss: "#F0564F",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      maxWidth: { shell: "1180px" },
    },
  },
  plugins: [],
};
