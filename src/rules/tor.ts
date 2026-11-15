// Règles de jet de L'Anneau Unique (2e édition). Logique pure : aucun accès au DOM, au réseau ni au stockage.
// ⚠ Les valeurs de REGLES ci-dessous sont à confirmer avec le livre de règles (voir README, « Règles à vérifier »).
import type { Rng } from './rng'; // type de la fonction de tirage

// Une face du dé du Destin (d12) : un nombre de 1 à 10, l'Œil de Sauron ou la rune de Gandalf.
export type FeatFace = number | 'eye' | 'gandalf';
// Mode du dé du Destin : normal, favorisé (deux dés, on garde le meilleur) ou défavorisé (on garde le pire).
export type FeatMode = 'normal' | 'favoured' | 'illfavoured';
// Niveau du résultat.
export type Level = 'echec' | 'reussite' | 'grande' | 'extraordinaire';

// Paramètres de règles, regroupés ici pour être corrigés à un seul endroit.
export const REGLES = {
  valeurOeil: 0, // valeur de l'Œil de Sauron dans le total
  valeurGandalf: 12, // valeur de la rune de Gandalf dans le total (le jet réussit de toute façon)
  seuilEpuise: 3, // Épuisé : un dé de Maîtrise de 1 à 3 compte pour 0
  faceRune: 6, // face du dé de Maîtrise qui porte la rune
  maitriseMax: 8, // nombre maximal de dés de Maîtrise proposé par l'app
  srMin: 2, // seuil de réussite minimal proposé
  srMax: 24, // seuil de réussite maximal proposé
} as const;

// Réglages d'un jet.
export interface RollInput {
  pool: number; // nombre de dés de Maîtrise
  mode: FeatMode; // mode du dé du Destin
  weary: boolean; // le héros est Épuisé
  miserable: boolean; // le héros est Mélancolique
  targetNumber: number; // seuil de réussite (SR)
}

// Faces brutes tirées avant toute interprétation (c'est ce que l'animation 3D montre).
export interface RawRoll {
  featFaces: FeatFace[]; // 1 dé du Destin, ou 2 si favorisé / défavorisé
  successFaces: number[]; // faces des dés de Maîtrise (1 à 6)
}

// Un dé de Maîtrise après interprétation.
export interface SuccessDieOutcome {
  face: number; // face obtenue
  value: number; // valeur comptée dans le total (0 si ignoré)
  rune: boolean; // la face porte la rune
  ignored: boolean; // ignoré à cause de l'état Épuisé
}

// Résultat complet d'un jet.
export interface Outcome {
  featFaces: FeatFace[]; // faces tirées sur le(s) dé(s) du Destin
  keptIndex: number; // position du dé du Destin retenu
  keptFace: FeatFace; // face retenue
  featValue: number; // valeur de la face retenue dans le total
  successDice: SuccessDieOutcome[]; // dés de Maîtrise interprétés
  total: number; // total comparé au SR
  runes: number; // nombre de runes sur les dés de Maîtrise
  targetNumber: number; // SR du jet
  eye: boolean; // la face retenue est l'Œil de Sauron
  gandalf: boolean; // la face retenue est la rune de Gandalf
  autoFail: boolean; // échec automatique (Œil + Mélancolique)
  success: boolean; // le jet est réussi
  level: Level; // niveau du résultat
}

// Remet des réglages dans des limites raisonnables (un nombre entier, un mode valide…).
export function normalizeInput(i: Partial<RollInput>): RollInput {
  const borne = (v: unknown, min: number, max: number, defaut: number) => {
    const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : defaut; // entier ou valeur par défaut
    return Math.min(max, Math.max(min, n)); // ramené entre min et max
  };
  const modes: FeatMode[] = ['normal', 'favoured', 'illfavoured']; // modes valides
  return {
    pool: borne(i.pool, 0, REGLES.maitriseMax, 3), // 3 dés par défaut
    mode: modes.includes(i.mode as FeatMode) ? (i.mode as FeatMode) : 'normal', // mode valide ou normal
    weary: i.weary === true, // booléen strict
    miserable: i.miserable === true, // booléen strict
    targetNumber: borne(i.targetNumber, REGLES.srMin, REGLES.srMax, 14), // SR 14 par défaut
  };
}

// Transforme un tirage 0..11 en face du dé du Destin : 0-9 → 1-10, 10 → Œil, 11 → Gandalf.
export function featFaceFromIndex(i: number): FeatFace {
  if (i < 0 || i > 11 || !Number.isInteger(i)) throw new RangeError('Index de face invalide'); // hors du d12
  if (i <= 9) return i + 1; // faces numérotées
  return i === 10 ? 'eye' : 'gandalf'; // faces spéciales
}

// Rang d'une face pour comparer deux dés du Destin : l'Œil est la pire face, la rune de Gandalf la meilleure.
export function featRank(face: FeatFace): number {
  if (face === 'eye') return -1; // pire que tout (même qu'un 1)
  if (face === 'gandalf') return 99; // meilleure que tout
  return face; // un nombre vaut son nombre
}

// Valeur d'une face dans le total.
export function featValue(face: FeatFace): number {
  if (face === 'eye') return REGLES.valeurOeil; // l'Œil
  if (face === 'gandalf') return REGLES.valeurGandalf; // la rune
  return face; // un nombre
}

// Choisit le dé du Destin retenu : favorisé = meilleur, défavorisé = pire, normal = le seul. À égalité : le premier.
export function pickFeat(faces: FeatFace[], mode: FeatMode): number {
  if (faces.length === 1 || mode === 'normal') return 0; // un seul dé : pas de choix
  const [a, b] = faces; // les deux dés
  const ra = featRank(a); // rang du premier
  const rb = featRank(b); // rang du second
  if (mode === 'favoured') return rb > ra ? 1 : 0; // garde le meilleur
  return rb < ra ? 1 : 0; // défavorisé : garde le pire
}

// Tire les faces brutes. Le hasard vient de la fonction de tirage reçue (jamais de l'animation).
export function rollRaw(input: RollInput, rng: Rng): RawRoll {
  const i = normalizeInput(input); // réglages propres
  const nbFeat = i.mode === 'normal' ? 1 : 2; // deux dés du Destin si favorisé ou défavorisé
  const featFaces: FeatFace[] = []; // faces du dé du Destin
  for (let k = 0; k < nbFeat; k++) featFaces.push(featFaceFromIndex(rng(12))); // un d12 par dé
  const successFaces: number[] = []; // faces des dés de Maîtrise
  for (let k = 0; k < i.pool; k++) successFaces.push(rng(6) + 1); // un d6 (1 à 6) par dé
  return { featFaces, successFaces }; // faces brutes
}

// Interprète des faces brutes selon les règles : total, runes, réussite, niveau.
export function evaluate(input: RollInput, raw: RawRoll): Outcome {
  const i = normalizeInput(input); // réglages propres
  const keptIndex = pickFeat(raw.featFaces, i.mode); // dé du Destin retenu
  const keptFace = raw.featFaces[keptIndex]; // sa face
  const successDice: SuccessDieOutcome[] = raw.successFaces.map((face) => {
    const rune = face === REGLES.faceRune; // la face porte-t-elle la rune ?
    const ignored = i.weary && face <= REGLES.seuilEpuise; // Épuisé : les petites faces ne comptent pas
    return { face, value: ignored ? 0 : face, rune, ignored }; // dé interprété
  });
  const eye = keptFace === 'eye'; // Œil de Sauron retenu
  const gandalf = keptFace === 'gandalf'; // rune de Gandalf retenue
  const somme = successDice.reduce((s, d) => s + d.value, 0); // somme des dés de Maîtrise
  const total = featValue(keptFace) + somme; // total du jet
  const runes = successDice.filter((d) => d.rune).length; // nombre de runes
  const autoFail = eye && i.miserable; // Œil + Mélancolique : échec automatique
  const success = !autoFail && (gandalf || total >= i.targetNumber); // Gandalf = réussite automatique
  let level: Level = 'echec'; // niveau par défaut
  if (success) level = runes >= 2 ? 'extraordinaire' : runes === 1 ? 'grande' : 'reussite'; // runes = niveaux de réussite
  return { featFaces: raw.featFaces, keptIndex, keptFace, featValue: featValue(keptFace), successDice, total, runes, targetNumber: i.targetNumber, eye, gandalf, autoFail, success, level };
}

// Raccourci : tire puis interprète.
export function rollOnce(input: RollInput, rng: Rng): { raw: RawRoll; outcome: Outcome } {
  const raw = rollRaw(input, rng); // faces brutes
  return { raw, outcome: evaluate(input, raw) }; // faces + interprétation
}
