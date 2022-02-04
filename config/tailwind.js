module.exports = {
  mode: "jit",
  content: ["./app/**/*.{js,jsx,ts,tsx,html}"], // Here we are going to tell Tailwind to use any .ts or .tsx file to purge the CSS
};
