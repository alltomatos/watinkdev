/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#09090b", // zinc-950
                surface: "#18181b",    // zinc-900
                primary: "#6366f1",    // indigo-500
                secondary: "#a855f7",  // purple-500
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-premium': 'linear-gradient(to right, #6366f1, #a855f7)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
