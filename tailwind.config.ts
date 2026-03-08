import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ["Orbitron", "monospace"],
        body:    ["Space Grotesk", "sans-serif"],
        data:    ["JetBrains Mono", "monospace"],
      },
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },
        /* Status palette */
        healthy:  "hsl(var(--status-healthy))",
        warning:  "hsl(var(--status-warning))",
        critical: "hsl(var(--status-critical))",
        nominal:  "hsl(var(--status-nominal))",
        /* Panel surface */
        panel: "hsl(var(--panel-bg))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":       { opacity: "0.4", transform: "scale(0.85)" },
        },
        "flicker": {
          "0%, 95%, 100%": { opacity: "1" },
          "96%":            { opacity: "0.85" },
          "98%":            { opacity: "0.9" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-6px)" },
        },
        "rotate-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "scan-line": {
          "0%":   { transform: "translateY(-4px)", opacity: "0" },
          "10%":  { opacity: "1" },
          "90%":  { opacity: "0.8" },
          "100%": { transform: "translateY(200px)", opacity: "0" },
        },
        "waveform": {
          "0%":   { transform: "scaleY(0.3)" },
          "50%":  { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(0.3)" },
        },
        "ping-slow": {
          "0%":   { transform: "scale(1)", opacity: "0.8" },
          "75%":  { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in-up":     "fade-in-up 0.6s ease-out forwards",
        "pulse-dot":      "pulse-dot 2s ease-in-out infinite",
        "flicker":        "flicker 8s ease-in-out infinite",
        "float":          "float 4s ease-in-out infinite",
        "rotate-slow":    "rotate-slow 20s linear infinite",
        "scan-line":      "scan-line 3s ease-in-out infinite",
        "waveform":       "waveform 1.2s ease-in-out infinite",
        "ping-slow":      "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(hsl(var(--grid-line)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--grid-line)) 1px, transparent 1px)",
        "globe-glow":   "radial-gradient(circle at 50% 50%, hsl(185 100% 50% / 0.12) 0%, transparent 65%)",
        "panel-grad":   "linear-gradient(135deg, hsl(220 28% 7%), hsl(220 28% 5%))",
      },
      backgroundSize: {
        "grid-48": "48px 48px",
      },
      boxShadow: {
        "glow-cyan":  "0 0 20px hsl(185 100% 50% / 0.3), 0 0 40px hsl(185 100% 50% / 0.1)",
        "glow-green": "0 0 16px hsl(142 70% 45% / 0.35)",
        "glow-amber": "0 0 16px hsl(38 95% 55% / 0.35)",
        "glow-red":   "0 0 16px hsl(0 85% 60% / 0.4)",
        "panel":      "0 4px 24px hsl(220 28% 2% / 0.8), inset 0 1px 0 hsl(220 20% 20% / 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
