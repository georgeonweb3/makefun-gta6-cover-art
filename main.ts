// Neon Coast Cover Studio — hand-in script for make.fun competition
// gta6-cover-art-01 (Node 22, standard library only).
//
// The entry itself is the static app in ./app (plain HTML/CSS/JS, no build
// step, no network requests) plus the screenshots in ./screenshots. This
// script stages both into the output directory and writes dossier.json,
// the summary the judge reads, using the vendored make.fun library.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.)
// Serve the app itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Directory holding this script, and the directory the dossier goes to.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function stageFolder(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
stageFolder('app');
stageFolder('screenshots');

// The scorer's caps: text_max_bytes shapes the dossier text; the rest refuse
// an entry the scorer would refuse — more than 4 screenshots or one over
// 256 KiB; more than 993 files or 48 MiB under app/; an app/ path over
// 1000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`staged Neon Coast Cover Studio into ${outputDir} (dossier.json written)`);
