// Chronologie des présages (en secondes). Fonctions pures : elles disent, à chaque instant, où en est chaque effet.
// Elles sont synchronisées avec les sons de src/audio/omenSound.ts (cor de l'Œil à 1,9 s, carillon de Gandalf à 0,6 s).

export const DUREE_S = 2.8; // durée totale d'une scène

// Borne une valeur entre a et b.
function borne(x: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, x)); // reste dans [a, b]
}

// Marche douce de 0 à 1 entre les instants a et b.
export function lisse(a: number, b: number, x: number): number {
  const t = borne((x - a) / (b - a), 0, 1); // avancement 0..1
  return t * t * (3 - 2 * t); // courbe douce
}

// Interpolation douce entre des points clés [instant, valeur] (instants croissants).
export function cles(t: number, pts: [number, number][]): number {
  if (t <= pts[0][0]) return pts[0][1]; // avant le premier point
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i]; // point courant
    const [t1, v1] = pts[i + 1]; // point suivant
    if (t < t1) return v0 + (v1 - v0) * lisse(t0, t1, t); // entre les deux
  }
  return pts[pts.length - 1][1]; // après le dernier point
}

// Bosse brève centrée sur l'instant c (battement de cœur, éclair).
function bosse(t: number, c: number, largeur: number): number {
  const x = (t - c) / largeur; // écart réduit
  return Math.exp(-x * x); // cloche
}

// Opacité d'ensemble : apparition rapide, disparition sur la fin.
function fondu(t: number): number {
  return lisse(0, 0.25, t) * (1 - lisse(2.35, DUREE_S, t)); // monte puis redescend
}

// État de l'Œil de Sauron à l'instant t.
export interface EyeState {
  open: number; // ouverture des paupières, 0 à 1
  pupilX: number; // décalage horizontal du regard (unités de l'écran de l'œil)
  dilate: number; // dilatation de la pupille, 0 à 1
  pulse: number; // battement, 0 à 1 (sur les battements du son)
  shake: number; // tremblement de caméra, 0 à 1
  flash: number; // éclair au coup de cor, 0 à 1
  fade: number; // opacité d'ensemble, 0 à 1
}
export function eyeState(t: number): EyeState {
  const apresCor = Math.max(0, t - 1.9); // temps écoulé depuis le coup de cor
  return {
    open: lisse(0.25, 0.95, t), // les paupières s'ouvrent de 0,25 à 0,95 s
    pupilX: cles(t, [[0.95, 0], [1.15, -0.3], [1.45, 0.3], [1.7, -0.14], [1.9, 0]]), // le regard cherche, puis te trouve
    dilate: lisse(1.9, 2.3, t), // la pupille se dilate quand l'œil te trouve
    pulse: Math.max(bosse(t, 0.7, 0.09), bosse(t, 0.95, 0.09), bosse(t, 1.6, 0.09), bosse(t, 1.85, 0.09)), // les 4 battements du son
    shake: t >= 1.9 ? Math.exp(-apresCor * 5) : 0, // tremblement qui s'éteint
    flash: t >= 1.9 ? Math.exp(-apresCor * 9) : 0, // éclair bref
    fade: fondu(t), // opacité
  };
}

// État du bâton de Gandalf à l'instant t.
export interface GandalfState {
  rise: number; // montée du bâton, 0 à 1
  ignite: number; // allumage du cristal, 0 à 1
  flash: number; // éclat à l'allumage, 0 à 1
  ring: number; // secondes depuis l'onde de lumière (-1 = pas encore partie)
  fade: number; // opacité d'ensemble, 0 à 1
}
export function gandalfState(t: number): GandalfState {
  return {
    rise: lisse(0, 0.6, t), // le bâton monte
    ignite: lisse(0.5, 0.9, t), // le cristal s'allume autour du carillon (0,6 s)
    flash: t >= 0.6 ? Math.exp(-(t - 0.6) * 6) : 0, // éclat au carillon
    ring: t >= 0.6 ? t - 0.6 : -1, // onde de lumière
    fade: fondu(t), // opacité
  };
}

// ---------- Fête des runes de réussite (tau) ----------

// Durée de la scène selon le niveau (1 sympa, 2 grandiose, 3 épique).
export function tauDuree(tier: number): number {
  return tier >= 3 ? 3.8 : tier === 2 ? 2.8 : 1.8; // en secondes
}

// Instant où le tau numéro i apparaît (en secondes).
export function tauArrivee(i: number): number {
  return 0.2 + i * 0.28; // un tau toutes les 0,28 s
}

// Coups forts de la scène : [instant, éclair, tremblement], de 0 à 1.
function coups(tier: number, n: number): [number, number, number][] {
  if (tier <= 1) return [[0.2, 0.3, 0]]; // sympa : un petit éclat
  if (tier === 2) return [[0.2, 0.4, 0.2], [0.48, 0.7, 0.6]]; // grandiose : deux coups
  const liste: [number, number, number][] = []; // épique : un coup par tau, puis deux grands finaux
  for (let i = 0; i < n; i++) liste.push([tauArrivee(i), 0.45, 0.35]); // un coup à chaque tau
  liste.push([tauArrivee(n - 1) + 0.35, 1, 1]); // grand final
  liste.push([2.0, 0.8, 0.8]); // second final
  return liste;
}

// État de la fête à l'instant t.
export interface TauState {
  fade: number; // opacité d'ensemble, 0 à 1
  shake: number; // tremblement, 0 à 1
  flash: number; // éclair, 0 à 1
}
export function tauState(t: number, tier: number, n: number): TauState {
  const d = tauDuree(tier); // durée de la scène
  let flash = 0; // éclair (le plus fort des coups)
  let shake = 0; // tremblement (le plus fort des coups)
  for (const [te, f, s] of coups(tier, Math.max(1, n))) {
    if (t < te) continue; // coup pas encore donné
    flash = Math.max(flash, f * Math.exp(-(t - te) * 9)); // éclair qui retombe vite
    shake = Math.max(shake, s * Math.exp(-(t - te) * 4)); // tremblement qui s'éteint
  }
  return { fade: lisse(0, 0.15, t) * (1 - lisse(d - 0.45, d, t)), shake, flash }; // fondu à l'entrée et à la sortie
}
