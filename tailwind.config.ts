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
        "fmz-blue": "var(--fmz-blue)",
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        syne: ['var(--font-syne)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
