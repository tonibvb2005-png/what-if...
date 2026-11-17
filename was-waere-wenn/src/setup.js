// Einmalig nach "npm install": Bibliotheken, Schriften und Kartendaten bereitlegen.
const fs = require('fs');
fs.writeFileSync('data.js', 'window.WORLD=' + fs.readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8') + ';');
for (const f of ['d3-array/dist/d3-array.min.js', 'd3-geo/dist/d3-geo.min.js', 'topojson-client/dist/topojson-client.min.js'])
  fs.copyFileSync('node_modules/' + f, f.split('/').pop());
for (const w of [600, 800, 900])
  fs.copyFileSync(`node_modules/@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff2`, `montserrat-latin-${w}-normal.woff2`);
console.log('fertig');
