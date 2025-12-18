import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}", // For non-src directory structure if applicable
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#0f172a", // --primary
                    light: "#1e293b",   // --primary-light
                    foreground: "#ffffff",
                },
                accent: {
                    DEFAULT: "#10b981", // --accent
                    hover: "#059669",   // --accent-hover
                },
                surface: "#ffffff",   // --surface
                muted: {
                    DEFAULT: "#64748b", // --text-muted
                    foreground: "#64748b",
                }
            },
            borderRadius: {
                sm: "6px",
                md: "12px",
                lg: "16px",
            },
            boxShadow: {
                sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            }
        },
    },
    plugins: [],
};
export default config;
