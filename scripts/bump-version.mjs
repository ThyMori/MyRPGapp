// Script de version : met à jour d'un coup src/version.ts, public/sw.js, package.json et CHANGELOG.md.
// Usage :  node scripts/bump-version.mjs patch|minor|major "Ce qui change"
//          node scripts/bump-version.mjs --check      (vérifie que les 4 fichiers sont d'accord)
import { readFileSync, writeFileSync } from 'node:fs'; // lecture et écriture de fichiers
import { dirname, join } from 'node:path'; // construction de chemins
import { fileURLToPath } from 'node:url'; // convertit l'adresse du script en chemin disque

// Dossier racine du projet (le dossier au-dessus de scripts/).
const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
// Chemins des quatre fichiers qui portent le numéro de version.
const chemins = {
  version: join(racine, 'src/version.ts'),
  sw: join(racine, 'public/sw.js'),
  pkg: join(racine, 'package.json'),
  log: join(racine, 'CHANGELOG.md'),
};
// Motif qui retrouve le numéro dans src/version.ts.
const RE_VERSION = /export const VERSION = '(\d+\.\d+\.\d+)';/;
// Motif qui retrouve le numéro dans le service worker.
const RE_SW = /const VERSION = '(\d+\.\d+\.\d+)';/;
// Motif qui retrouve le numéro de la première entrée du journal.
const RE_LOG = /^## (\d+\.\d+\.\d+) /m;

// Lit les quatre numéros de version actuellement écrits dans les fichiers.
function lireVersions() {
  return {
    version: readFileSync(chemins.version, 'utf8').match(RE_VERSION)?.[1], // numéro de src/version.ts
    sw: readFileSync(chemins.sw, 'utf8').match(RE_SW)?.[1], // numéro du service worker
    pkg: JSON.parse(readFileSync(chemins.pkg, 'utf8')).version, // numéro de package.json
    log: readFileSync(chemins.log, 'utf8').match(RE_LOG)?.[1], // numéro du haut du journal
  };
}

// Mode vérification : tous les numéros doivent être identiques.
function verifier() {
  const v = lireVersions(); // les quatre numéros
  const uniques = new Set(Object.values(v)); // ensemble des valeurs distinctes
  if (uniques.size !== 1 || uniques.has(undefined)) {
    console.error('Versions incohérentes :', v); // affiche le détail
    process.exit(1); // sortie en erreur : le workflow s'arrête
  }
  console.log(`Versions cohérentes : ${v.version}`); // tout va bien
}

// Calcule le nouveau numéro à partir de l'ancien et du niveau demandé.
function suivante(actuelle, niveau) {
  const [x, y, z] = actuelle.split('.').map(Number); // sépare les trois nombres
  if (niveau === 'major') return `${x + 1}.0.0`; // changement majeur : y et z repartent à 0
  if (niveau === 'minor') return `${x}.${y + 1}.0`; // nouvelle fonction : z repart à 0
  return `${x}.${y}.${z + 1}`; // correction : on incrémente z
}

// Applique la nouvelle version dans les quatre fichiers.
function bump(niveau, note) {
  const ancienne = lireVersions().version; // numéro actuel
  const nouvelle = suivante(ancienne, niveau); // numéro à écrire
  // 1. src/version.ts
  const v = readFileSync(chemins.version, 'utf8').replace(RE_VERSION, `export const VERSION = '${nouvelle}';`);
  writeFileSync(chemins.version, v);
  // 2. public/sw.js (le changement de ce fichier force le navigateur à mettre à jour le cache)
  const sw = readFileSync(chemins.sw, 'utf8').replace(RE_SW, `const VERSION = '${nouvelle}';`);
  writeFileSync(chemins.sw, sw);
  // 3. package.json
  const pkg = JSON.parse(readFileSync(chemins.pkg, 'utf8')); // objet du package
  pkg.version = nouvelle; // nouveau numéro
  writeFileSync(chemins.pkg, JSON.stringify(pkg, null, 2) + '\n');
  // 4. CHANGELOG.md : nouvelle entrée en haut, juste sous le titre
  const date = new Date().toISOString().slice(0, 10); // date du jour, format AAAA-MM-JJ
  const lignes = note.split(' | ').map((l) => `- ${l}`).join('\n'); // " | " sépare plusieurs puces
  const log = readFileSync(chemins.log, 'utf8').replace('# Journal des versions\n', `# Journal des versions\n\n## ${nouvelle} — ${date}\n${lignes}\n`);
  writeFileSync(chemins.log, log);
  console.log(`Version ${ancienne} → ${nouvelle}`); // récapitulatif
}

// Point d'entrée : lit les arguments de la ligne de commande.
const [, , a, b] = process.argv;
if (a === '--check') {
  verifier(); // mode vérification
} else if (['patch', 'minor', 'major'].includes(a) && b) {
  bump(a, b); // mode incrément
  verifier(); // contrôle final de cohérence
} else {
  console.error('Usage : node scripts/bump-version.mjs patch|minor|major "Note" | --check');
  process.exit(1); // arguments invalides
}
