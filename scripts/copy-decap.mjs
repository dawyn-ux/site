// Copie Decap CMS (interface d'administration) depuis node_modules vers public/admin/vendor.
// Exécuté automatiquement avant « npm run dev » et « npm run build ».
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve('decap-cms/package.json')), 'dist');
const dest = new URL('../public/admin/vendor/', import.meta.url).pathname;

if (existsSync(dest)) rmSync(dest, { recursive: true });
mkdirSync(dest, { recursive: true });
let count = 0;
for (const file of readdirSync(src)) {
  // Seul le bundle « decap-cms » (et ses morceaux chargés à la demande) est nécessaire
  if (file.endsWith('.js') && file.includes('decap-cms')) {
    cpSync(join(src, file), join(dest, file));
    count++;
  }
}
console.log(`[decap] ${count} fichiers copiés dans public/admin/vendor/`);
