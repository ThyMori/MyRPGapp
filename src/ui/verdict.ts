// Annonce « RÉUSSITE » / « ÉCHEC » façon borne d'arcade des années 80 : chaque lettre tombe l'une après l'autre.
// Le style (police pixel, dégradé chromé, lignes néon, balayage) est dans src/styles/omens.css.

// Construit le décor de l'annonce. win = jet réussi ; sous = petite ligne sous le mot (niveau de réussite), vide sinon.
export function buildVerdict(win: boolean, sous: string): HTMLElement {
  const boite = document.createElement('div'); // boîte de l'annonce
  boite.className = `arc-box ${win ? 'arc-win' : 'arc-lose'}`; // couleur selon le résultat
  boite.setAttribute('role', 'status'); // lue par les lecteurs d'écran
  const haut = document.createElement('div'); // ligne néon du haut
  haut.className = 'arc-line';
  const mot = document.createElement('div'); // le mot
  mot.className = 'arc-word';
  mot.setAttribute('aria-label', win ? 'Réussite' : 'Échec'); // lu en entier, pas lettre par lettre
  [...(win ? 'RÉUSSITE' : 'ÉCHEC')].forEach((lettre, i) => {
    const s = document.createElement('span'); // une lettre
    s.className = 'arc-letter';
    s.setAttribute('aria-hidden', 'true'); // l'aria-label du mot suffit
    s.style.animationDelay = `${0.05 + i * 0.07}s, ${0.9 + i * 0.05}s`; // chute puis clignotement / affaissement, décalés
    s.textContent = lettre; // texte fixe, jamais de texte de l'utilisateur
    mot.appendChild(s);
  });
  boite.append(haut, mot);
  if (sous) {
    const p = document.createElement('div'); // sous-titre (niveau de réussite)
    p.className = 'arc-sub';
    p.textContent = sous;
    boite.appendChild(p);
  }
  const bas = document.createElement('div'); // ligne néon du bas
  bas.className = 'arc-line';
  boite.appendChild(bas);
  return boite;
}
