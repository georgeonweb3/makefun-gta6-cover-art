// Neon Coast Cover Studio: the program that hands the entry in.
// Node 22, standard library only. It copies app/ and screenshots/ from
// beside this file into /output (or MAKEFUN_OUTPUT_DIR outside the
// grader) and writes /output/dossier.json with the vendored make.fun
// library, so the judge reads the same dossier the gate checks.
// Run it locally: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps the scorer enforces: at most 4 screenshots, each at most 256 KiB;
// app/ at most 993 files and 48 MiB in all; no path under app/ over 1000
// bytes. The dossier text is capped at 160 KiB by buildDossier.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
