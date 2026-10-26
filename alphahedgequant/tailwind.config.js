/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ahq-ink)",
        surface: "var(--ahq-surface)",
        raised: "var(--ahq-raised)",
        line: "var(--ahq-line)",
        body: "var(--ahq-body)",
        muted: "var(--ahq-muted)",
        amber: "var(--ahq-amber)",       // AHQ gold — yellow-gold (updated brand accent)
        amberdim: "var(--ahq-amberdim)",
        gold: "var(--ahq-gold)",
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
