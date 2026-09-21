/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12101a",
        panel: "#1c1926",
        panel2: "#252131",
        accent: "#ff5da2",
        accent2: "#7c5cff",
        gold: "#ffc65c"
      },
      fontFamily: {
        display: ["'Poppins'", "sans-serif"]
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c5cff 0%, #ff5da2 60%, #ffc65c 100%)"
      }
    }
  },
  plugins: []
};
