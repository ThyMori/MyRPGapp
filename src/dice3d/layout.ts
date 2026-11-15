// Disposition des dés posés sur l'écran. Fonctions pures : ne dépendent ni de Three.js ni du DOM.

// Type de dé : le dé du Destin (d12) ou un dé de Maîtrise (d6).
export type DieKind = 'feat' | 'success';
// Point sur la table (x : gauche-droite, z : haut-bas de l'écran, z grandit vers le bas).
export interface Point {
  x: number; // position horizontale
  z: number; // position verticale
}
// Nombre aléatoire dans [0, 1[ (Math.random en vrai, une suite fixe dans les tests).
export type Random = () => number;

// Rayon d'encombrement de chaque type de dé, en unités de la table (sert à éviter que deux dés se chevauchent).
export const DIE_RADIUS: Record<DieKind, number> = { feat: 1.0, success: 1.05 };
// Espace minimal entre deux dés posés.
const ECART = 0.05;
// Nombre d'essais par dé et par tentative.
const ESSAIS = 40;

// Essai « au hasard » : chaque dé prend la candidate la plus dégagée parmi ESSAIS tirages. Rend aussi le plus petit « jeu » obtenu
// (≥ 0 = aucun chevauchement).
function essaiAleatoire(kinds: DieKind[], halfW: number, halfH: number, rng: Random, radius: Record<DieKind, number>): { poses: Point[]; jeuMin: number } {
  const poses: Point[] = []; // dés déjà placés
  const rayons: number[] = []; // leurs rayons
  let jeuMin = Infinity; // plus petit jeu entre deux dés
  for (const kind of kinds) {
    const r = radius[kind]; // rayon de ce dé
    const mx = Math.max(0, halfW - r); // amplitude horizontale possible du centre
    const mz = Math.max(0, halfH - r); // amplitude verticale possible du centre
    let meilleur: Point = { x: 0, z: 0 }; // meilleure position trouvée
    let meilleurJeu = -Infinity; // son jeu : distance libre jusqu'au dé le plus proche (négatif = chevauchement)
    for (let n = 0; n < ESSAIS; n++) {
      const c: Point = { x: (rng() * 2 - 1) * mx, z: (rng() * 2 - 1) * mz }; // position candidate
      let jeu = Infinity; // distance libre de cette candidate
      poses.forEach((p, j) => {
        jeu = Math.min(jeu, Math.hypot(c.x - p.x, c.z - p.z) - r - rayons[j] - ECART); // distance libre jusqu'au dé j
      });
      if (jeu > meilleurJeu) {
        meilleur = c; // on retient la candidate la plus dégagée
        meilleurJeu = jeu;
      }
      if (jeu >= 0) break; // aucune gêne : on s'arrête là
    }
    jeuMin = Math.min(jeuMin, meilleurJeu); // met à jour le pire jeu
    poses.push(meilleur); // pose le dé
    rayons.push(r); // mémorise son rayon
  }
  return { poses, jeuMin }; // positions et pire jeu
}

// Repli : un quadrillage dont chaque case contient au plus un dé, posé au hasard dans sa case. Rend null si les cases ne suffisent pas.
function quadrillage(kinds: DieKind[], halfW: number, halfH: number, rng: Random, radius: Record<DieKind, number>): Point[] | null {
  const cote = 2 * Math.max(...kinds.map((k) => radius[k])) + ECART; // côté minimal d'une case
  const cols = Math.floor((2 * halfW) / cote); // colonnes possibles
  const rows = Math.floor((2 * halfH) / cote); // rangées possibles
  if (cols < 1 || rows < 1 || cols * rows < kinds.length) return null; // pas assez de cases
  const cw = (2 * halfW) / cols; // largeur d'une case
  const ch = (2 * halfH) / rows; // hauteur d'une case
  const cases: number[] = Array.from({ length: cols * rows }, (_, i) => i); // numéros de cases
  for (let i = cases.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); // mélange de Fisher-Yates
    [cases[i], cases[j]] = [cases[j], cases[i]]; // échange
  }
  return kinds.map((k, i) => {
    const c = cases[i] % cols; // colonne de la case
    const r = Math.floor(cases[i] / cols); // rangée de la case
    const sx = Math.max(0, (cw - 2 * radius[k] - ECART) / 2); // liberté de mouvement horizontale dans la case
    const sz = Math.max(0, (ch - 2 * radius[k] - ECART) / 2); // liberté verticale
    return { x: -halfW + (c + 0.5) * cw + (rng() * 2 - 1) * sx, z: -halfH + (r + 0.5) * ch + (rng() * 2 - 1) * sz }; // centre de la case + petit décalage
  });
}

// Répartit les dés au hasard sur l'écran (rectangle de demi-largeur halfW et de demi-hauteur halfH, centré sur 0),
// sans qu'ils se chevauchent ni sortent du cadre. Si le hasard n'y arrive pas, on passe à un quadrillage ; si la place manque
// vraiment, chaque dé prend la position la moins mauvaise.
export function scatterDice(kinds: DieKind[], halfW: number, halfH: number, rng: Random, radius: Record<DieKind, number> = DIE_RADIUS): Point[] {
  let meilleur = essaiAleatoire(kinds, halfW, halfH, rng, radius); // premier essai
  for (let n = 1; n < 3 && meilleur.jeuMin < 0; n++) {
    const autre = essaiAleatoire(kinds, halfW, halfH, rng, radius); // un autre essai
    if (autre.jeuMin > meilleur.jeuMin) meilleur = autre; // garde le meilleur
  }
  if (meilleur.jeuMin >= 0) return meilleur.poses; // le hasard a bien réparti les dés
  return quadrillage(kinds, halfW, halfH, rng, radius) ?? meilleur.poses; // sinon quadrillage, sinon le moins mauvais
}
