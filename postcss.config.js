// VegaEdgeFrontEnd-main/postcss.config.js
// CORRECT for Vercel build

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    // If you use autoprefixer, which is common:
    'autoprefixer': {},
  },
};