// Fenêtres de dialogue natives (<dialog>). Fermées par le bouton « Fermer », par le fond, par Échap et par « Retour » du téléphone.
import { all, byId } from './dom'; // outils de recherche d'éléments

// Ouvre une fenêtre. Le focus va sur le titre (et pas sur un champ), pour ne pas ouvrir le clavier pour rien.
export function openDialog(id: string): void {
  const d = byId<HTMLDialogElement>(id); // la fenêtre
  if (d.open) return; // déjà ouverte
  d.showModal(); // ouverture modale (fond bloqué)
  d.querySelector<HTMLElement>('h2[tabindex]')?.focus(); // focus sur le titre
}

// Une fenêtre est-elle ouverte ?
export function isDialogOpen(): boolean {
  return document.querySelector('dialog[open]') !== null; // cherche une fenêtre ouverte
}

// Ferme la fenêtre ouverte la plus récente.
export function closeTopDialog(): void {
  const ouvertes = all<HTMLDialogElement>('dialog[open]'); // fenêtres ouvertes
  ouvertes[ouvertes.length - 1]?.close(); // ferme la dernière
}

// Branche la fermeture par le bouton et par le fond.
export function initDialogs(): void {
  for (const d of all<HTMLDialogElement>('dialog')) {
    d.addEventListener('click', (e) => {
      if (e.target === d) d.close(); // clic sur le fond (hors du contenu) : ferme
    });
    for (const b of all('[data-close]', d)) b.addEventListener('click', () => d.close()); // boutons « Fermer »
  }
}
