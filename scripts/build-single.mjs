// Bundle the built app (dist/) into one self-contained HTML file: dist/polako.html.
// Used to publish the app as a single web page.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const assets = readdirSync('dist/assets');
const js = assets.filter((f) => f.endsWith('.js')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
const icon = Buffer.from(readFileSync('public/icon.svg')).toString('base64');

const html = `<title>Polako</title>
<meta name="description" content="Polako – Kroatisch spielerisch lernen, Schritt für Schritt." />
<meta name="theme-color" content="#0b5cad" />
<link rel="icon" href="data:image/svg+xml;base64,${icon}" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js.replace(/<\/script/gi, '<\\/script')}
</script>
`;
writeFileSync('dist/polako.html', html);
console.log(`dist/polako.html (${(html.length / 1024).toFixed(0)} KB)`);
