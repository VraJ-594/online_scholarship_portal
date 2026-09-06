const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.jsx",
    ...flowbite.content(), // Spread the Flowbite content configuration
  ],
  theme: {
    extend: {
      // Custom animations and keyframes
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseGrow: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-in-right": "slideInRight 0.5s ease-out",
        "slide-in-left": "slideInLeft 0.5s ease-out",
        "spin-slow": "spinSlow 3s linear infinite",
        "pulse-grow": "pulseGrow 1.5s ease-in-out infinite",
      },
      // Custom background images
      backgroundImage: {
        "custom-login": "url('/public/hd_login_bg.avif')", // Define your custom background
      },
    },
  },
  plugins: [flowbite.plugin()],
};
