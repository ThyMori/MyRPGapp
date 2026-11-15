// Disposition des dés sur la table. Fonction pure : ne dépend ni de Three.js ni du DOM.

// Type de dé : le dé du Destin (d12) ou un dé de Maîtrise (d6).
export type DieKind = 'feat' | 'success';
// Position d'un dé sur la table (x : gauche-droite, z : haut-bas de l'écran).
export interface Placement {
  x: number; // position horizontale
  z: number; // position verticale (vers le bas de l'écran quand z augmente)
}

// Range les dés : dés du Destin sur la première rangée, dés de Maîtrise en dessous, par rangées.
// aspect = largeur / hauteur de la zone d'affichage ; cell = espace entre deux dés.
export function layoutDice(kinds: DieKind[], aspect: number, cell = 2.7): { placements: Placement[]; width: number; depth: number } {
  const feat: number[] = []; // positions (dans la liste) des dés du Destin
  const succ: number[] = []; // positions des dés de Maîtrise
  kinds.forEach((k, i) => (k === 'feat' ? feat : succ).push(i)); // répartit les dés
  const colonnes = Math.max(3, Math.min(6, Math.floor(aspect * 3))); // plus l'écran est large, plus on met de dés par rangée
  const rangees: number[][] = []; // rangées de dés
  if (feat.length) rangees.push(feat); // première rangée : dés du Destin
  for (let i = 0; i < succ.length; i += colonnes) rangees.push(succ.slice(i, i + colonnes)); // puis les dés de Maîtrise
  const placements: Placement[] = new Array(kinds.length); // résultat, dans l'ordre d'origine
  rangees.forEach((rangee, r) => {
    rangee.forEach((index, c) => {
      placements[index] = { x: (c - (rangee.length - 1) / 2) * cell, z: (r - (rangees.length - 1) / 2) * cell }; // rangée centrée
    });
  });
  const largeur = Math.max(1, ...rangees.map((r) => r.length)) * cell; // largeur occupée
  const profondeur = Math.max(1, rangees.length) * cell; // hauteur occupée
  return { placements, width: largeur, depth: profondeur }; // disposition complète
}
