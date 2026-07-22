/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#05070b",
        surface: "#0C0D11",
        raised: "#13151B",
        line: "rgba(148,163,184,0.14)",
        body: "#E6EAF2",
        muted: "#8A94A8",
        amber: "#d8b24a",       // AHQ gold (--gold-500)
        amberdim: "#B97F22",
        gold: "#d8b24a",
        cyan: "#22c3d6",         // AHQ systems/live-data accent (--cyan-500)
        gain: "#2DD482",
        loss: "#F0564F",
      },
      fontFamily: {
        // AHQ design system: Playfair Display (display) · Archivo (body) · JetBrains Mono (data)
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["Archivo", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      maxWidth: { shell: "1180px" },
    },
  },
  plugins: [],
};
