// Calendrier des scènes après un lancer. L'annonce « Réussite / Échec » passe en premier, dès que les dés sont immobiles ;
// les dés restent visibles jusqu'à la fin de toutes les scènes (annonce, présage, fête des tau). Fonction pure.

// scenesMs : somme des durées des scènes prévues. baseMs : durée normale pendant laquelle les dés restent visibles.
export function planHold(scenesMs: number, baseMs: number): number {
  return Math.max(0, scenesMs, baseMs); // les dés restent au moins la durée normale, et jamais moins que les scènes
}
