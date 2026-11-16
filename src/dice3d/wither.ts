// Flétrissement des dés annulés (état Épuisé) : chronologie pure, partagée par l'animation et le son pour qu'ils restent synchronisés.

export const WITHER_DUREE_S = 2.6; // durée du flétrissement, en secondes

// Battements de cœur : [instant, force]. Des « lub-dub » qui se ralentissent et faiblissent.
export const BATTEMENTS: [number, number][] = [
  [0.0, 1.0], [0.17, 0.7], // premier battement, franc
  [0.7, 0.85], [0.88, 0.6], // deuxième, un peu plus lent
  [1.5, 0.6], [1.7, 0.42], // troisième, plus faible
  [2.4, 0.3], // dernier souffle : un seul coup, à peine
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
  return { wither: lisse(0.15, 2.3, t), beat }; // flétrissement lent, battements brefs
}
