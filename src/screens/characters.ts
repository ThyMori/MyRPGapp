// Écran « Personnages » : liste des fiches, éditeur à sections repliables, lien avec le lanceur de dés.
// Tout est gardé sur l'appareil (src/state/characters.ts). L'enregistrement est automatique à chaque modification.
import { ATTRS, ATTR_MAX, ATTR_MIN, COMBAT_SKILLS, INFO_KEYS, RANG_MAX, SKILLS, type Character, type InfoKey } from '../characters/model'; // modèle
import { rollSetup, seuilReussite, totalParade, totalProtection } from '../characters/derive'; // calculs
import { emptyCharacter, sanitizeCharacter } from '../characters/sanitize'; // fiches
import { loadCharacters, saveCharacters } from '../state/characters'; // stockage
import { loadJson, saveJson } from '../state/storage'; // dernière fiche ouverte
import { byId } from '../ui/dom'; // éléments
import { openDialog } from '../ui/dialogs'; // fenêtres
import { onScreenShown, showScreen } from '../ui/nav'; // navigation
import { areaField, checkField, counter, dots, h, scale, section, textField } from '../ui/sheetFields'; // champs
import { showToast } from '../ui/toast'; // messages
import { setRollInput } from './roller'; // règle le lanceur

const LABELS_INFO: Record<InfoKey, string> = {
  culture: 'Culture héroïque',
  avantage: 'Avantage culturel',
  vocation: 'Vocation',
  niveauVie: 'Niveau de vie',
  garant: 'Garant',
  particularites: 'Particularités',
  voieOmbre: "Voie de l'Ombre",
  defauts: 'Défauts',
}; // libellés des champs « Personnage »

let liste: Character[] = []; // toutes les fiches
let ouvert: Character | null = null; // fiche en cours d'édition (null = on voit la liste)
let minuteur = 0; // enregistrement différé
let aSupprimer: string | null = null; // fiche dont la suppression attend confirmation

// Identifiant unique d'une fiche.
function newId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`; // date + hasard
}

// Une fiche est-elle ouverte dans l'éditeur ? (utilisé par le bouton Retour)
export function isCharacterOpen(): boolean {
  return ouvert !== null; // état courant
}

// Enregistre tout de suite ; prévient si le stockage refuse.
function enregistrer(): void {
  window.clearTimeout(minuteur); // annule l'enregistrement différé
  if (!saveCharacters(liste)) showToast("Impossible d'enregistrer : le stockage de l'appareil est plein ou bloqué.", 'error'); // dit quoi faire
}

// Appelé à chaque modification : met la date à jour et enregistre peu après (évite d'écrire à chaque lettre).
function modifie(): void {
  if (ouvert) ouvert.modifieLe = Date.now(); // date de modification
  window.clearTimeout(minuteur); // repart de zéro
  minuteur = window.setTimeout(enregistrer, 300); // écrit dans 0,3 s
}

// Ferme l'éditeur et revient à la liste (enregistre d'abord).
export function closeCharacter(): void {
  if (!ouvert) return; // rien à fermer
  enregistrer(); // rien ne se perd
  ouvert = null; // retour à la liste
  saveJson('character-open', null); // on ne rouvrira pas cette fiche
  afficher(); // redessine
}

// Ouvre une fiche dans l'éditeur.
function ouvrir(c: Character): void {
  ouvert = c; // fiche courante
  saveJson('character-open', c.id); // l'app rouvrira ici
  afficher(); // redessine
  byId('character-editor').scrollTop = 0; // en haut
}

// Crée une fiche vierge et l'ouvre.
function creer(): void {
  const c = emptyCharacter(newId(), Date.now()); // fiche vierge
  liste = [c, ...liste]; // en tête de liste
  enregistrer(); // garde
  ouvrir(c); // ouvre
}

// Duplique une fiche (nouvelle identité, nom suivi de « (copie) »).
function dupliquer(c: Character): void {
  const copie = sanitizeCharacter({ ...JSON.parse(JSON.stringify(c)), id: newId(), nom: `${c.nom || 'Sans nom'} (copie)`.slice(0, 80), creeLe: Date.now(), modifieLe: Date.now() }); // copie remise en ordre
  if (!copie) return; // ne devrait pas arriver
  liste = [copie, ...liste]; // en tête
  enregistrer();
  afficher();
  showToast('Fiche dupliquée.', 'ok');
}

// Demande confirmation avant de supprimer.
function demanderSuppression(c: Character): void {
  aSupprimer = c.id; // mémorise
  byId('delete-char-name').textContent = c.nom || 'Sans nom'; // nom (textContent : jamais de HTML)
  openDialog('dialog-delete-char'); // fenêtre de confirmation
}

// Supprime pour de bon la fiche confirmée.
function supprimer(): void {
  if (!aSupprimer) return; // rien à supprimer
  liste = liste.filter((c) => c.id !== aSupprimer); // retire
  aSupprimer = null;
  if (ouvert && !liste.includes(ouvert)) { ouvert = null; saveJson('character-open', null); } // l'éditeur se ferme
  enregistrer();
  afficher();
  showToast('Fiche supprimée.', 'ok');
}

// Prépare le lanceur pour une compétence et y va.
function lancer(c: Character, id: string): void {
  const s = rollSetup(c, id); // réglages
  if (!s) return; // inconnue
  setRollInput(s.input); // règle le lanceur
  showScreen('roller'); // y va
  const etat = s.input.weary || s.input.miserable ? ` (${[s.input.weary ? 'Épuisé' : '', s.input.miserable ? 'Mélancolique' : ''].filter(Boolean).join(', ')})` : ''; // états repris
  showToast(`${s.label}${c.nom ? ` de ${c.nom}` : ''} : ${s.input.pool} dé${s.input.pool > 1 ? 's' : ''} de Maîtrise, SR ${s.input.targetNumber}${s.input.mode === 'favoured' ? ', Favorisé' : ''}${etat}. Touche Lancer.`); // dit ce qui a été réglé
}

// Ligne d'une compétence : case « favorisée », nom (touche = lancer), pastilles de rang.
function ligneCompetence(c: Character, id: string, label: string, rang: number, favorisee: boolean | null, onRang: (v: number) => void, onFav?: (v: boolean) => void): HTMLElement {
  const row = h('div', 'skill'); // ligne
  if (favorisee !== null && onFav) {
    const f = h('input', 'skill-fav'); // case « favorisée »
    f.type = 'checkbox';
    f.checked = favorisee;
    f.setAttribute('aria-label', `${label} : favorisée`);
    f.addEventListener('change', () => onFav(f.checked));
    row.appendChild(f);
  } else row.appendChild(h('span', 'skill-fav-space')); // même alignement sans case
  const nom = h('button', 'skill-name', label); // nom = bouton de lancer
  nom.type = 'button';
  nom.setAttribute('aria-label', `Lancer ${label}`);
  nom.addEventListener('click', () => lancer(c, id));
  row.append(nom, dots(label, rang, RANG_MAX, onRang));
  return row;
}

// Construit tout l'éditeur de la fiche ouverte.
function construireEditeur(c: Character): HTMLElement {
  const racine = h('div', 'sheet'); // conteneur
  const nom = textField('Nom', c.nom, (v) => { c.nom = v; modifie(); }, 80); // nom
  nom.classList.add('sheet-name');
  racine.appendChild(nom);

  // Personnage
  const infos = INFO_KEYS.map((k) => textField(LABELS_INFO[k], c.info[k], (v) => { c.info[k] = v; modifie(); })); // champs courts
  racine.appendChild(section('Personnage', true, ...infos, areaField('Histoire', c.histoire, (v) => { c.histoire = v; modifie(); }, 4000)));

  // Compteurs de progression
  const cpt = (label: string, get: () => number, set: (v: number) => void, aide?: string) => counter(label, get(), 0, 99, (v) => { set(v); modifie(); }, aide); // compteur 0..99
  racine.appendChild(section('Vaillance, Sagesse et points', false,
    h('div', 'grid2', undefined),
  ));
  const pts = racine.lastElementChild!.querySelector('.grid2')!; // grille à remplir
  pts.append(
    cpt('Vaillance', () => c.vaillance, (v) => (c.vaillance = v), `SR Cœur : ${seuilReussite(c.attrs.coeur)}`),
    cpt('Sagesse', () => c.sagesse, (v) => (c.sagesse = v), `SR Esprit : ${seuilReussite(c.attrs.esprit)}`),
    cpt("Points d'Aventure", () => c.aventure, (v) => (c.aventure = v)),
    cpt('Points de Progression', () => c.progression, (v) => (c.progression = v)),
    cpt('Points de Communauté', () => c.communaute, (v) => (c.communaute = v)),
  );

  // Attributs
  const attrs = ATTRS.map((a) => {
    const bloc = h('div', 'attr'); // un attribut
    const num = h('span', 'sr-num'); // seuil calculé, dans le cadre en losange
    const cadre = h('div', 'sr-diamond'); // cadre du seuil
    cadre.appendChild(num);
    const maj = () => { num.textContent = String(seuilReussite(c.attrs[a.id])); }; // met à jour le nombre
    bloc.append(
      h('h4', '', a.label),
      scale(`Valeur de ${a.label}`, c.attrs[a.id], ATTR_MIN, ATTR_MAX, (v) => { c.attrs[a.id] = v; maj(); modifie(); }, { 2: 'Faible', 4: 'Moyen', 6: 'Bon', 8: 'Excellent' }), // valeur
      cadre,
      h('p', 'sr-label', `Seuil de Réussite de ${a.label}`),
      h('p', 'sr-formula', '20 − Valeur'),
    );
    maj();
    return bloc;
  });
  racine.appendChild(section('Attributs', true, ...attrs));

  // Compétences
  const comps: HTMLElement[] = [h('p', 'sheet-hint', "Touche le nom d'une compétence pour régler le lanceur de dés. La case de gauche marque une compétence favorisée.")]; // aide
  for (const a of ATTRS) {
    comps.push(h('h4', 'skill-group', a.label)); // titre du groupe
    for (const s of SKILLS.filter((x) => x.attr === a.id)) {
      comps.push(ligneCompetence(c, s.id, s.label, c.skills[s.id].rang, c.skills[s.id].favorisee, (v) => { c.skills[s.id].rang = v; modifie(); }, (v) => { c.skills[s.id].favorisee = v; modifie(); }));
    }
  }
  racine.appendChild(section('Compétences', true, ...comps));

  // Endurance et espoir
  const num = (label: string, o: Record<string, number>, k: string) => counter(label, o[k], 0, 99, (v) => { o[k] = v; modifie(); }); // compteur d'un objet
  const g1 = h('div', 'grid2');
  g1.append(num('Maximum', c.endurance as unknown as Record<string, number>, 'max'), num('Actuelle', c.endurance as unknown as Record<string, number>, 'actuelle'), num('Charge', c.endurance as unknown as Record<string, number>, 'charge'), num('Fatigue', c.endurance as unknown as Record<string, number>, 'fatigue'));
  racine.appendChild(section('Endurance', true, g1));
  const g2 = h('div', 'grid2');
  g2.append(num('Maximum', c.espoir as unknown as Record<string, number>, 'max'), num('Actuel', c.espoir as unknown as Record<string, number>, 'actuelle'), num('Ombre', c.espoir as unknown as Record<string, number>, 'ombre'), num('Séquelles', c.espoir as unknown as Record<string, number>, 'sequelles'));
  racine.appendChild(section('Espoir', true, g2));

  // États
  racine.appendChild(section('États', true,
    h('p', 'sheet-hint', 'Épuisé et Mélancolique sont repris automatiquement dans le lanceur de dés.'),
    h('div', 'toggles'),
    areaField('Blessure', c.blessure, (v) => { c.blessure = v; modifie(); }, 300),
  ));
  const tg = racine.lastElementChild!.querySelector('.toggles')!; // cases des états
  tg.append(checkField('Épuisé', c.etats.epuise, (v) => { c.etats.epuise = v; modifie(); }), checkField('Mélancolique', c.etats.melancolique, (v) => { c.etats.melancolique = v; modifie(); }), checkField('Blessé', c.etats.blesse, (v) => { c.etats.blesse = v; modifie(); }));

  // Récompenses et vertus
  racine.appendChild(section('Récompenses et Vertus', false, areaField('Récompenses et Vertus', c.recompenses, (v) => { c.recompenses = v; modifie(); })));

  // Combat
  const cb: HTMLElement[] = [h('h4', 'skill-group', 'Compétences de combat (SR Corps)')];
  for (const s of COMBAT_SKILLS) cb.push(ligneCompetence(c, s.id, s.label, c.combat[s.id], null, (v) => { c.combat[s.id] = v; modifie(); }));
  cb.push(h('h4', 'skill-group', 'Attirail de guerre'));
  c.armes.forEach((a, i) => {
    const bloc = h('div', 'gear'); // une arme
    bloc.append(
      textField(`Arme ${i + 1}`, a.nom, (v) => { a.nom = v; modifie(); }, 60),
      textField('Dégâts', a.degats, (v) => { a.degats = v; modifie(); }, 20),
      textField('Blessure', a.blessure, (v) => { a.blessure = v; modifie(); }, 20),
      textField('Charge', a.charge, (v) => { a.charge = v; modifie(); }, 20),
      textField('Notes', a.notes, (v) => { a.notes = v; modifie(); }, 120),
    );
    cb.push(bloc);
  });
  cb.push(h('h4', 'skill-group', 'Armure'));
  c.armures.forEach((a, i) => {
    const bloc = h('div', 'gear'); // une pièce
    bloc.append(textField(`Pièce ${i + 1}`, a.nom, (v) => { a.nom = v; modifie(); }, 60), textField('Charge', a.charge, (v) => { a.charge = v; modifie(); }, 20));
    cb.push(bloc);
  });
  const totP = h('p', 'attr-sr'); // total de parade
  const totR = h('p', 'attr-sr'); // total de protection
  const majTot = () => { totP.textContent = `Parade : ${totalParade(c)}`; totR.textContent = `Protection : ${totalProtection(c)}`; }; // met à jour les totaux
  const nm = (label: string, o: Record<string, number>, k: string) => counter(label, o[k], 0, 99, (v) => { o[k] = v; majTot(); modifie(); }); // compteur qui recalcule
  const gp = h('div', 'grid2');
  gp.append(nm('Parade : base', c.parade as unknown as Record<string, number>, 'base'), nm('Parade : bouclier', c.parade as unknown as Record<string, number>, 'bouclier'), nm('Parade : autre', c.parade as unknown as Record<string, number>, 'autre'));
  const gr = h('div', 'grid2');
  gr.append(nm('Protection : armure', c.protection as unknown as Record<string, number>, 'armure'), nm('Protection : casque', c.protection as unknown as Record<string, number>, 'casque'), nm('Protection : autre', c.protection as unknown as Record<string, number>, 'autre'));
  majTot();
  cb.push(h('h4', 'skill-group', 'Parade et protection'), gp, totP, gr, totR);
  racine.appendChild(section('Combat', false, ...cb));

  // Équipement et trésor
  racine.appendChild(section('Équipement de voyage', false, areaField('Équipement de voyage', c.equipement, (v) => { c.equipement = v; modifie(); }), counter('Trésor', c.tresor, 0, 9999, (v) => { c.tresor = v; modifie(); })));
  return racine;
}

// Une carte de la liste.
function carte(c: Character): HTMLElement {
  const li = h('li', 'char-card'); // carte
  const ouvrirBtn = h('button', 'char-open'); // zone principale : ouvre la fiche
  ouvrirBtn.type = 'button';
  ouvrirBtn.append(h('span', 'char-name', c.nom || 'Sans nom'), h('span', 'char-sub', [c.info.culture, c.info.vocation].filter(Boolean).join(' · ') || 'Fiche vide'));
  ouvrirBtn.addEventListener('click', () => ouvrir(c));
  const dup = h('button', 'char-act', 'Dupliquer'); // action secondaire
  dup.type = 'button';
  dup.setAttribute('aria-label', `Dupliquer ${c.nom || 'Sans nom'}`);
  dup.addEventListener('click', () => dupliquer(c));
  const sup = h('button', 'char-act char-del', 'Supprimer'); // action secondaire
  sup.type = 'button';
  sup.setAttribute('aria-label', `Supprimer ${c.nom || 'Sans nom'}`);
  sup.addEventListener('click', () => demanderSuppression(c));
  li.append(ouvrirBtn, dup, sup);
  return li;
}

// Affiche la liste ou l'éditeur selon l'état.
function afficher(): void {
  const vueListe = byId('character-list-view'); // vue liste
  const vueEdit = byId('character-editor'); // vue éditeur
  vueListe.hidden = ouvert !== null; // liste cachée si on édite
  vueEdit.hidden = ouvert === null; // éditeur caché sinon
  byId('btn-char-back').hidden = ouvert === null; // bouton « Liste » seulement dans l'éditeur
  if (ouvert) {
    const corps = byId('character-sheet'); // zone de la fiche
    corps.replaceChildren(construireEditeur(ouvert)); // construit
    return;
  }
  const ul = byId('character-list'); // liste
  ul.replaceChildren(...liste.map(carte)); // une carte par fiche
  byId('character-empty').hidden = liste.length > 0; // état vide : dit quoi faire
}

// Démarre l'écran.
export function initCharacters(): void {
  liste = loadCharacters(); // fiches enregistrées
  byId('btn-char-new').addEventListener('click', creer); // « Nouveau personnage »
  byId('btn-char-new-empty').addEventListener('click', creer); // même action depuis l'état vide
  byId('btn-char-back').addEventListener('click', closeCharacter); // retour à la liste
  byId('btn-delete-char-ok').addEventListener('click', () => { supprimer(); byId<HTMLDialogElement>('dialog-delete-char').close(); }); // confirme
  byId<HTMLDialogElement>('dialog-delete-char').addEventListener('close', () => { aSupprimer = null; }); // annule si fermée autrement
  window.addEventListener('pagehide', enregistrer); // rien ne se perd si l'app est fermée
  document.addEventListener('visibilitychange', () => { if (document.hidden) enregistrer(); }); // ni si elle passe en arrière-plan
  const id = loadJson('character-open'); // dernière fiche ouverte
  ouvert = typeof id === 'string' ? liste.find((c) => c.id === id) ?? null : null; // si elle n'existe plus : la liste
  onScreenShown('characters', afficher); // redessine à chaque affichage de l'écran
  afficher();
}
