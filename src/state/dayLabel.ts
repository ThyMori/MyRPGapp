// Libellé d'un jour pour les séparateurs de l'historique : « Aujourd'hui », « Hier », puis la date.
// Fonction pure : le « maintenant » est donné en paramètre pour pouvoir la tester.

// Compare deux dates sur le calendrier local (année, mois, jour).
function memeJour(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); // tout est égal
}

// Rend le libellé du jour d'un instant ts (en millisecondes) vu depuis maintenant.
export function dayLabel(ts: number, maintenant: number): string {
  const jour = new Date(ts); // le jour demandé
  const aujourdhui = new Date(maintenant); // aujourd'hui
  if (memeJour(jour, aujourdhui)) return "Aujourd'hui"; // même jour
  const hier = new Date(maintenant); // copie de maintenant
  hier.setDate(hier.getDate() - 1); // recule d'un jour
  if (memeJour(jour, hier)) return 'Hier'; // la veille
  // Sinon : date longue en français, avec l'année si ce n'est pas l'année en cours.
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }; // jour de la semaine, jour, mois
  if (jour.getFullYear() !== aujourdhui.getFullYear()) options.year = 'numeric'; // ajoute l'année si besoin
  return jour.toLocaleDateString('fr-FR', options); // texte formaté
}

// Heure d'un instant, au format 21:05.
export function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); // heures et minutes
}
