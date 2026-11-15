// Trajectoire d'un dé lancé sur tout l'écran : il arrive du bas, rebondit sur les bords puis se pose à sa place.
// Fonctions pures (sans Three.js ni DOM). L'animation ne décide de rien : le dé finit TOUJOURS à `rest`.
import type { Point, Random } from './layout'; // point et hasard

// Murs de la table : |x| ≤ x (gauche et droite) et z ≥ -top (haut de l'écran). Le bas est ouvert : les dés y entrent.
export interface Walls {
  x: number; // distance du centre aux murs gauche et droit
  top: number; // distance du centre au mur du haut
}
// Plan de vol d'un dé.
export interface Flight {
  start: Point; // point de départ, hors de l'écran (en bas)
  virtual: Point; // cible « dépliée » : si elle dépasse un mur, la trajectoire se replie dessus
  rest: Point; // position finale, posée
}
// Un choc sonore et visuel : instant (0 = départ du dé, 1 = arrivée), force (0 à 1), nature.
export interface Impact {
  t: number; // instant du choc, fraction de la durée du lancer
  strength: number; // force du choc
  kind: 'floor' | 'wall'; // rebond sur la table ou choc contre un bord
}

// Ralentissement du dé : rapide au départ, il s'arrête en douceur. t et le résultat vont de 0 à 1.
export const easeOut = (t: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
// Fonction inverse : à quel instant t le dé a-t-il parcouru la fraction e du trajet ?
export const easeOutInverse = (e: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, e)), 1 / 3);

// Replie une coordonnée contre un mur bas (lo) et un mur haut (hi), comme un rebond.
export function fold(v: number, lo: number, hi: number): number {
  if (v > hi) return 2 * hi - v; // dépasse le mur haut : renvoyée vers l'intérieur
  if (v < lo) return 2 * lo - v; // dépasse le mur bas : renvoyée vers l'intérieur
  return v; // à l'intérieur : inchangée
}

// Prépare le vol d'un dé vers sa place finale. startZ = hauteur de départ, sous le bord bas de l'écran.
// La cible est parfois « dépliée » derrière un mur : le dé file vers elle, heurte le mur, puis revient vers `rest`.
export function planFlight(rest: Point, walls: Walls, startZ: number, rng: Random): Flight {
  const start: Point = { x: (rng() * 2 - 1) * walls.x, z: startZ }; // part de n'importe où sous l'écran
  const cote = rng(); // tirage du rebond latéral
  const vx = cote < 0.33 ? -2 * walls.x - rest.x : cote > 0.66 ? 2 * walls.x - rest.x : rest.x; // rebond à gauche, à droite ou aucun
  const vz = rng() < 0.6 ? -2 * walls.top - rest.z : rest.z; // rebond sur le mur du haut, ou non
  return { start, virtual: { x: vx, z: vz }, rest: { ...rest } }; // plan complet
}

// Position du dé quand il a parcouru la fraction e (0 à 1) de son trajet : ligne droite vers la cible, repliée sur les murs.
export function flightPosition(f: Flight, e: number, walls: Walls): Point {
  const x = f.start.x + (f.virtual.x - f.start.x) * e; // abscisse « dépliée »
  const z = f.start.z + (f.virtual.z - f.start.z) * e; // profondeur « dépliée »
  return { x: fold(x, -walls.x, walls.x), z: fold(z, -walls.top, Infinity) }; // repliées dans la table
}

// Chocs d'un vol, triés par instant : 2 rebonds sur la table, la pose finale, et chaque choc contre un mur.
export function impactEvents(f: Flight, walls: Walls): Impact[] {
  const evts: Impact[] = [
    { t: 1 / 2.4, strength: 0.7, kind: 'floor' }, // premier rebond (les sauts de DiceStage retouchent le sol à k / 2,4)
    { t: 2 / 2.4, strength: 0.35, kind: 'floor' }, // second rebond
    { t: 1, strength: 0.2, kind: 'floor' }, // le dé se pose
  ];
  // Mur : la trajectoire dépliée le traverse à la fraction s du trajet ; plus le choc est tôt, plus le dé va vite.
  const mur = (debut: number, fin: number, position: number) => {
    const s = (position - debut) / (fin - debut); // fraction du trajet au moment du choc
    if (!(s > 0 && s < 1)) return; // pas de choc sur ce mur
    const t = easeOutInverse(s); // instant correspondant
    evts.push({ t, strength: 0.25 + 0.75 * Math.pow(1 - t, 2), kind: 'wall' }); // la vitesse décroît comme (1 - t)²
  };
  if (f.virtual.x > walls.x) mur(f.start.x, f.virtual.x, walls.x); // mur de droite
  if (f.virtual.x < -walls.x) mur(f.start.x, f.virtual.x, -walls.x); // mur de gauche
  if (f.virtual.z < -walls.top) mur(f.start.z, f.virtual.z, -walls.top); // mur du haut
  return evts.sort((a, b) => a.t - b.t); // dans l'ordre du temps
}
