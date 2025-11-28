/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Captura arquivos dentro da pasta src (padrão)
    "./src/**/*.{js,ts,jsx,tsx}",
    // Captura arquivos que estejam soltos na raiz (por segurança)
    "./*.{js,ts,jsx,tsx}",
    // Captura arquivos em components se estiverem na raiz
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}