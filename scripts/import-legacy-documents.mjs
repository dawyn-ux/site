// Importe les PDF de l'ancien site (http://www.connect-systemes.fr) dans public/documents/
// et met à jour les fiches de src/content/documents/*.yml.
//
// Usage (depuis un poste ayant accès à l'ancien site) :  npm run import-docs
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../src/content/documents/', import.meta.url).pathname;
const out = new URL('../public/documents/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
  const path = join(dir, file);
  const yml = readFileSync(path, 'utf8');
  const legacy = yml.match(/^legacy_url:\s*"?([^"\n]+)"?/m)?.[1]?.trim();
  const current = yml.match(/^file:\s*"?([^"\n]*)"?/m)?.[1]?.trim();
  if (!legacy || current) continue;

  const name = `${file.replace(/\.ya?ml$/, '')}.pdf`;
  process.stdout.write(`→ ${legacy} … `);
  try {
    const res = await fetch(legacy);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.subarray(0, 4).toString() !== '%PDF') throw new Error("ce n'est pas un PDF");
    writeFileSync(join(out, name), buf);
    writeFileSync(path, yml.replace(/^file:.*$/m, `file: "/documents/${name}"`));
    console.log(`ok (${(buf.length / 1024).toFixed(0)} Ko) → /documents/${name}`);
  } catch (err) {
    console.log(`échec : ${err.message}`);
  }
}
