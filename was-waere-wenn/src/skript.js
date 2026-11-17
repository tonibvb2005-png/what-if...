// Erzeugt den Sprechertext (für ElevenLabs) + Untertitel-Version aus einer Episoden-Datei.
// Nutzung: node skript.js schweiz > skript_schweiz.md
global.window = {};
const ep = process.argv[2] || 'schweiz';
require('./episodes/' + ep + '.js');
const E = window.EPISODE;
const spoken = t => t.replace(/\{[\d.]+\}\s*/g, '… ').replace(/\[([^|\]]+)\|([^\]]+)\]/g, '$2');
const shown = t => t.replace(/\{[\d.]+\}\s*/g, '').replace(/\[([^|\]]+)\|([^\]]+)\]/g, '$1');
let md = `# Was wäre, wenn du ${E.inCountry} geboren wärst? – Tag ${E.day} mit Nomi\n\n`;
md += `## Sprechertext für ElevenLabs (zum Kopieren)\n\n`;
md += E.scenes.map(s => spoken(s.text)).join('\n\n') + '\n\n';
md += `## Ablauf (Nomis Tag)\n\n| # | Uhrzeit | Szene | Text (so wie im Untertitel) |\n|---|---|---|---|\n`;
E.scenes.forEach((s, i) => {
  md += `| ${i + 1} | ${s.time || '–'} | ${s.type} | ${shown(s.text)} |\n`;
});
md += `\n## Hinweise\n\n- Zahlen sind im Sprechertext ausgeschrieben, damit die Stimme sie richtig ausspricht.\n- Kurze Pause an den Gedankenstrichen (–) lassen.\n- Fertige Audiodatei hochladen → Untertitel, Mundbewegung und Animationen werden auf die Stimme synchronisiert.\n`;
process.stdout.write(md);
