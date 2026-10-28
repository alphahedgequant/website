/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ahq-ink-rgb) / <alpha-value>)",
        surface: "rgb(var(--ahq-surface-rgb) / <alpha-value>)",
        raised: "rgb(var(--ahq-raised-rgb) / <alpha-value>)",
        line: "var(--ahq-line)",
        body: "rgb(var(--ahq-body-rgb) / <alpha-value>)",
        muted: "rgb(var(--ahq-muted-rgb) / <alpha-value>)",
        amber: "rgb(var(--ahq-amber-rgb) / <alpha-value>)",       // AHQ gold — yellow-gold (updated brand accent)
        amberdim: "rgb(var(--ahq-amberdim-rgb) / <alpha-value>)",
        gold: "rgb(var(--ahq-gold-rgb) / <alpha-value>)",
        cyan: "#22c3d6",         // AHQ systems/live-data accent (--cyan-500)
        gain: "#2DD482",
        loss: "#F0564F",
      },
      fontFamily: {
        // AHQ design system: Playfair Display (display) · Archivo (body) · JetBrains Mono (data)
        display: ["Manrope", "Archivo", "sans-serif"],
        body: ["'DM Sans'", "Archivo", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      maxWidth: { shell: "1440px" },
    },
  },
  plugins: [],
};
