// Calendrier de l'annonce « Réussite / Échec » : elle apparaît au moment où les dés commencent à s'effacer.
// Fonction pure : prend la durée des scènes déjà prévues (présage, fête des tau) et la durée normale pendant laquelle les dés restent.

export interface VerdictPlan {
  holdMs: number; // durée totale pendant laquelle les dés restent visibles avant de s'effacer
  pauseMs: number; // attente avant l'annonce, comptée à partir de l'arrivée des dés (0 si les scènes durent déjà assez)
}

// scenesMs : somme des durées des scènes déjà en file. baseMs : durée normale de maintien des dés.
export function planVerdict(scenesMs: number, baseMs: number): VerdictPlan {
  const s = Math.max(0, scenesMs); // jamais négatif
  const base = Math.max(0, baseMs); // jamais négatif
  return { holdMs: Math.max(s, base), pauseMs: Math.max(0, base - s) }; // les dés s'effacent quand l'annonce commence
}
