/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                parchment: '#F4F1EA',
                ink: '#1A1A1A',
                klein: '#002FA7',
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', 'monospace'],
                serif: ['"EB Garamond"', 'serif'],
            },
        },
    },
    plugins: [],
}
