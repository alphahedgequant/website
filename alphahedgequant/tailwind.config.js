/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050506",
        surface: "#0C0D11",
        raised: "#13151B",
        line: "rgba(148,163,184,0.14)",
        body: "#E6EAF2",
        muted: "#8A94A8",
        amber: "#F0A93B",
        amberdim: "#B97F22",
        gain: "#2DD482",
        loss: "#F0564F",
      },
      fontFamily: {
        // Editorial serif for all display headings (matches the AHQ design system)
        display: ["'Fraunces'", "Georgia", "serif"],
        // Grotesk kept available for UI chrome that wants a sans heading
        grotesk: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      maxWidth: { shell: "1180px" },
    },
  },
  plugins: [],
};
