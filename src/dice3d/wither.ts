// Flétrissement des dés annulés (état Épuisé) : chronologie pure, partagée par l'animation et le son pour qu'ils restent synchronisés.

export const WITHER_DUREE_S = 1.9; // durée du flétrissement, en secondes

// Battements de cœur : [instant, force]. Des « lub-dub » qui se ralentissent et faiblissent.
export const BATTEMENTS: [number, number][] = [
  [0.0, 1.0], [0.15, 0.75], // premier battement, franc
  [0.55, 0.9], [0.7, 0.65], // deuxième, un peu plus lent
  [1.15, 0.7], [1.3, 0.5], // troisième, plus faible
  [1.75, 0.4], // dernier souffle : un seul coup
];

// Marche douce de 0 à 1 entre deux instants.
function lisse(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a))); // avancement borné
  return t * t * (3 - 2 * t); // courbe douce
}

// État d'un dé qui se flétrit à l'instant t.
export interface WitherState {
  wither: number; // flétrissement, 0 (intact) à 1 (flétri)
  beat: number; // battement en cours, 0 à 1
}
export function witherState(t: number): WitherState {
  let beat = 0; // le plus fort des battements récents
  for (const [tb, f] of BATTEMENTS) {
    if (t < tb) continue; // pas encore battu
    beat = Math.max(beat, f * Math.exp(-(t - tb) * 14)); // gonfle d'un coup, puis retombe vite
  }
  return { wither: lisse(0.08, 1.5, t), beat }; // flétrissement lent, battements brefs
}
