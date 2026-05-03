import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "fmz-gold": "var(--fmz-gold)",
        "fmz-gold-dark": "var(--fmz-gold-dark)",
        "fmz-navy": "var(--fmz-navy)",
        "fmz-text-primary": "var(--fmz-text-primary)",
        "fmz-text-muted": "var(--fmz-text-muted)",
        "fmz-text-hint": "var(--fmz-text-hint)",
        "fmz-border-light": "var(--fmz-border-light)",
        "fmz-border-mid": "var(--fmz-border-mid)",
        "fmz-input": "var(--fmz-input)",
        "fmz-page": "var(--fmz-page)",
        "fmz-card": "var(--fmz-card)",
        "fmz-blue": "var(--fmz-blue)",
        "fmz-error": "var(--fmz-error)",
        "fmz-error-bg": "var(--fmz-error-bg)",
        "fmz-error-border": "var(--fmz-error-border)",
        "fmz-warning": "var(--fmz-warning)",
        "fmz-warning-bg": "var(--fmz-warning-bg)",
        "fmz-warning-border": "var(--fmz-warning-border)",
        "fmz-success": "var(--fmz-success)",
        "fmz-success-bg": "var(--fmz-success-bg)",
        "fmz-success-border": "var(--fmz-success-border)",
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        syne: ['var(--font-syne)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
