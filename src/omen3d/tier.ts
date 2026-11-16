// Niveau de célébration des runes de réussite (les 6 des dés de Maîtrise, le « tau »).

// 0 = rien, 1 = « sympa » (une rune), 2 = « grandiose » (deux runes), 3 = « épique » (trois runes ou plus).
export type Tier = 0 | 1 | 2 | 3;

// Niveau d'après le nombre de runes. Seul un jet réussi se fête : un échec ne déclenche rien.
export function tauTier(runes: number, success: boolean): Tier {
  if (!success || !Number.isFinite(runes) || runes < 1) return 0; // pas de fête
  return runes >= 3 ? 3 : runes === 2 ? 2 : 1; // 1, 2, 3 et plus
}

// Nombre de tau dessinés à l'écran (plafonné pour rester lisible sur un téléphone).
export const TAU_MAX = 5;
export function tauShown(runes: number): number {
  return Math.min(TAU_MAX, Math.max(1, Math.floor(runes))); // de 1 à 5
}
