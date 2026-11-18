// Fenêtre d'information des boutons « i » : titre, puis une ou plusieurs entrées (nom, résumé, page du livre).
import { byId } from './dom'; // accès par identifiant
import { openDialog } from './dialogs'; // fenêtres

// Crée un élément avec classe et texte (textContent : jamais de HTML).
function el<K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texte: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag); // élément
  e.className = classe; // classe
  e.textContent = texte; // texte sûr
  return e;
}

// Une entrée affichée dans la fenêtre.
export interface EntreeInfo {
  nom?: string; // nom de l'élément (omis s'il n'y en a qu'un et que le titre le dit)
  texte: string; // explication
  page?: number; // page du livre de base
}

// Ouvre la fenêtre avec les entrées données (tout le texte passe par textContent).
export function montrerInfos(titre: string, entrees: EntreeInfo[]): void {
  byId('info-title').textContent = titre; // titre
  const corps = byId('info-body'); // zone de contenu
  corps.replaceChildren(); // vide l'ancien contenu
  for (const e of entrees) {
    const bloc = document.createElement('div'); // une entrée
    bloc.className = 'info-item'; // style
    if (e.nom) bloc.appendChild(el('strong', 'info-nom', e.nom)); // nom en gras
    bloc.appendChild(el('p', 'info-texte', e.texte)); // explication
    if (e.page) bloc.appendChild(el('span', 'info-page', `Livre, p. ${e.page}`)); // renvoi au livre
    corps.appendChild(bloc);
  }
  openDialog('dialog-info'); // ouvre (Retour la ferme)
}
