// Vice Sunset Cover Studio — entrypoint for make.fun gta6-cover-art-01.
//
// This program is the hand-in step: it takes the app/ folder and the
// screenshots/ folder that sit beside this file in the repository, copies
// both into the output directory the platform provides, and writes the
// dossier.json summary there with the vendored make.fun library. It only
// uses the Node standard library, so it runs in the grader's container with
// nothing installed. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// the platform's /output directory.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the folder this file lives in.
const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));

// The platform hands us a writable output folder; locally we fall back to
// the same MAKEFUN_OUTPUT_DIR override the kit documents.
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// Copy a folder tree when it exists, file by file so a missing screenshots
// folder is a loud failure instead of a silent empty hand-in. Returns how
// many top-level entries were copied, so the log can say what went in.
function copyTree(sourceDir, targetDir) {
  if (!existsSync(sourceDir)) {
    throw new Error(`expected folder is missing: ${sourceDir}`);
  }
  mkdirSync(targetDir, { recursive: true });
  const names = readdirSync(sourceDir);
  for (const name of names) {
    cpSync(join(sourceDir, name), join(targetDir, name), { recursive: true });
  }
  return names.length;
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  const appEntries = copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
  const shotEntries = copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
  console.log(`copied ${appEntries} app entries and ${shotEntries} screenshots`);

  // The dossier is the judge's view of the entry: the library reads the
  // freshly copied folders and summarises them, capped so the whole hand-in
  // stays inside the platform's own limits (at most 4 screenshots, app/
  // under 993 files / 48 MiB, source text under 160 KiB).
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  return dossier.length;
}

const bytes = handIn();
console.log(`handed in ${bytes} bytes of dossier to ${outputDir}`);
