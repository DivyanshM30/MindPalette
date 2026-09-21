import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#fbf0f2', 100: '#f5e1e7', 200: '#e8c5d1',
                    300: '#dbadb8', 400: '#c8869f', 500: '#93465f',
                    600: '#823a52', 700: '#713046', 800: '#59283c',
                    900: '#3c202e', 950: '#24151e',
                },
                ink: {
                    50: '#fffafb', 100: '#f8edf0', 200: '#e3cbd3',
                    300: '#ceb0bd', 400: '#b28e9f', 500: '#856574',
                    600: '#785c69', 700: '#60434f', 800: '#382630',
                    900: '#281d24', 950: '#1b1419',
                },
                paper: 'rgb(var(--paper) / <alpha-value>)',
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
