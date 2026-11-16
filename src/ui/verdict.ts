// Annonce « RÉUSSITE » / « ÉCHEC » : une bande sobre au centre de l'écran, sans bruit ni effets. Le style est dans src/styles/omens.css.

// Construit le décor de l'annonce. win = jet réussi ; sous = petite ligne sous le mot (niveau de réussite), vide sinon.
export function buildVerdict(win: boolean, sous: string): HTMLElement {
  const boite = document.createElement('div'); // bande de l'annonce
  boite.className = `verdict-box ${win ? 'verdict-win' : 'verdict-lose'}`; // couleur selon le résultat
  boite.setAttribute('role', 'status'); // lue par les lecteurs d'écran
  const mot = document.createElement('div'); // le mot
  mot.className = 'verdict-word';
  mot.textContent = win ? 'Réussite' : 'Échec'; // texte fixe, jamais de texte de l'utilisateur
  boite.appendChild(mot);
  if (sous) {
    const p = document.createElement('div'); // sous-titre (niveau de réussite)
    p.className = 'verdict-sub';
    p.textContent = sous;
    boite.appendChild(p);
  }
  return boite;
}
