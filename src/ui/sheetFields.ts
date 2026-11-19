// Petits constructeurs de champs pour la fiche de personnage. Rien n'est jamais écrit avec innerHTML : tout passe par textContent / value.

import { detailPour, type Categorie } from '../characters/details'; // résumés des boutons « i »
import { montrerInfos, type EntreeInfo } from './infoDialog'; // fenêtre d'information

// Crée un élément avec classe et texte.
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, classe = '', texte?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag); // l'élément
  if (classe) e.className = classe; // sa classe
  if (texte !== undefined) e.textContent = texte; // son texte (jamais du HTML)
  return e;
}

// Champ de texte court avec son libellé. onChange reçoit la nouvelle valeur à chaque frappe.
export function textField(label: string, valeur: string, onChange: (v: string) => void, max = 120): HTMLElement {
  const lab = h('label', 'field'); // enveloppe cliquable
  lab.appendChild(h('span', 'field-label', label)); // libellé
  const inp = h('input'); // champ
  inp.type = 'text'; // texte
  inp.value = valeur; // valeur actuelle
  inp.maxLength = max; // longueur maximale
  inp.autocomplete = 'off'; // pas de suggestions
  inp.addEventListener('input', () => onChange(inp.value)); // à chaque frappe
  lab.appendChild(inp);
  return lab;
}

// Un groupe d'options d'un menu déroulant : titre facultatif (affiché comme en-tête de groupe) et liste de choix.
export interface Groupe {
  titre?: string; // titre du groupe
  options: string[]; // choix
}

// Remplit un <select> avec une entrée vide, puis les groupes.
function remplir(sel: HTMLSelectElement, groupes: Groupe[], vide: string): void {
  sel.appendChild(new Option(vide, '')); // entrée vide : rien choisi
  for (const g of groupes) {
    const parent: HTMLElement = g.titre ? sel.appendChild(h('optgroup')) : sel; // groupe ou menu lui-même
    if (g.titre) (parent as HTMLOptGroupElement).label = g.titre; // titre du groupe
    for (const o of g.options) parent.appendChild(new Option(o, o)); // un choix (textContent, jamais de HTML)
  }
}

const AUTRE = '__autre__'; // valeur interne du choix « saisie libre »

// Bouton « i » : appelle onClic (accessible, zone tactile suffisante).
function boutonInfo(label: string, onClic: () => void): HTMLButtonElement {
  const b = h('button', 'info-btn', 'i'); // bouton rond
  b.type = 'button';
  b.setAttribute('aria-label', `Détail : ${label}`); // lecteur d'écran
  b.addEventListener('click', onClic); // ouvre la fenêtre
  return b;
}

// Menu déroulant avec son libellé. Le dernier choix, « Autre… », ouvre un champ pour écrire une valeur qui n'est pas dans le livre.
// Une valeur déjà enregistrée hors des listes s'affiche directement dans ce champ. onChange reçoit la valeur ('' si vide).
// Si categorie est donnée, un bouton « i » explique la valeur choisie.
export function selectField(label: string, valeur: string, groupes: Groupe[], onChange: (v: string) => void, vide = '—', categorie?: Categorie): HTMLElement {
  const lab = h('div', 'field field-select'); // enveloppe
  const entete = h('div', 'field-head'); // ligne libellé + « i »
  entete.appendChild(h('span', 'field-label', label)); // libellé
  let courant = valeur; // valeur affichée en ce moment
  if (categorie) entete.appendChild(boutonInfo(label, () => {
    const det = detailPour(categorie, courant); // détail de la valeur
    if (det) montrerInfos(courant, [{ texte: det.resume, page: det.page }]); // valeur du livre
    else if (courant) montrerInfos(courant, [{ texte: 'Valeur personnelle : elle n’est pas dans le livre, donc pas de détail ici.' }]); // saisie libre
    else montrerInfos(label, [{ texte: 'Choisis une valeur dans le menu pour voir son détail.' }]); // rien choisi
  }));
  lab.appendChild(entete);
  const sel = h('select'); // menu
  sel.setAttribute('aria-label', label); // nom accessible
  remplir(sel, groupes, vide);
  sel.appendChild(new Option('Autre (saisie libre)…', AUTRE)); // dernier choix
  const libre = h('input', 'field-libre'); // champ de saisie libre
  libre.type = 'text';
  libre.maxLength = 60;
  libre.placeholder = 'Écris ta propre valeur';
  libre.setAttribute('aria-label', `${label} : saisie libre`);
  const connue = groupes.some((g) => g.options.includes(valeur)); // la valeur est-elle dans les listes ?
  if (valeur && !connue) { sel.value = AUTRE; libre.value = valeur; } // valeur personnelle : affichée dans le champ
  else { sel.value = valeur; libre.hidden = true; } // valeur de la liste (ou vide)
  sel.addEventListener('change', () => {
    if (sel.value === AUTRE) { libre.hidden = false; libre.focus(); courant = libre.value; onChange(libre.value); } // ouvre la saisie libre
    else { libre.hidden = true; courant = sel.value; onChange(sel.value); } // choix de la liste
  });
  libre.addEventListener('input', () => { courant = libre.value; onChange(libre.value); }); // à chaque frappe
  lab.append(sel, libre);
  return lab;
}

// Menu « ajouter » : un choix appelle onPick puis le menu revient à son titre (sert à compléter un texte libre).
// Si categorieDe est donnée, un bouton « i » liste le détail de toutes les options du menu.
export function pickField(label: string, groupes: Groupe[], onPick: (v: string) => void, categorieDe?: (v: string) => Categorie): HTMLElement {
  const lab = h('div', 'field field-select'); // enveloppe
  const entete = h('div', 'field-head'); // ligne libellé + « i »
  entete.appendChild(h('span', 'field-label', label)); // libellé
  if (categorieDe) entete.appendChild(boutonInfo(label, () => {
    const entrees: EntreeInfo[] = []; // une entrée par option connue
    for (const g of groupes) for (const o of g.options) {
      const det = detailPour(categorieDe(o), o); // détail de l'option
      if (det) entrees.push({ nom: o, texte: det.resume, page: det.page });
    }
    montrerInfos(label, entrees); // affiche la liste
  }));
  lab.appendChild(entete);
  const sel = h('select'); // menu
  sel.setAttribute('aria-label', label); // nom accessible
  remplir(sel, groupes, 'Ajouter…');
  sel.addEventListener('change', () => {
    if (sel.value) onPick(sel.value); // transmet le choix
    sel.value = ''; // revient au titre
  });
  lab.appendChild(sel);
  return lab;
}

// Marque un champ comme « valeur de jeu » : il reste modifiable quand la fiche est verrouillée, et il est mis en avant.
export function vivant<T extends HTMLElement>(el: T): T {
  el.dataset.live = '1'; // repéré par le verrou
  el.classList.add('live'); // surlignage quand la fiche est verrouillée
  return el;
}

// Marque un champ calculé automatiquement (grisé tant que les calculs automatiques sont actifs).
export function calcule<T extends HTMLElement>(el: T, actif: boolean): T {
  if (!actif) return el; // calculs coupés : champ libre
  el.dataset.auto = '1'; // repéré par le verrou
  el.classList.add('auto'); // aspect « calculé »
  return el;
}

// Menu à choix fermé (pas de saisie libre) avec libellé et « i » facultatif. onChange reçoit la valeur choisie ('' pour le choix vide).
export function choixField(label: string, valeur: string, options: { valeur: string; label: string }[], onChange: (v: string) => void, vide = '—', aide?: string, page?: number): HTMLElement {
  const lab = h('div', 'field field-select'); // enveloppe
  const entete = h('div', 'field-head'); // ligne libellé + « i »
  entete.appendChild(h('span', 'field-label', label)); // libellé
  if (aide) entete.appendChild(boutonInfo(label, () => montrerInfos(label, [{ texte: aide, page }]))); // explication
  lab.appendChild(entete);
  const sel = h('select'); // menu
  sel.setAttribute('aria-label', label); // nom accessible
  sel.appendChild(new Option(vide, '')); // choix vide
  for (const o of options) sel.appendChild(new Option(o.label, o.valeur)); // options
  sel.value = options.some((o) => o.valeur === valeur) ? valeur : ''; // valeur connue, sinon vide
  sel.addEventListener('change', () => onChange(sel.value)); // transmet
  lab.appendChild(sel);
  return lab;
}

// Champ de texte long (qui s'agrandit seul) avec son libellé.
export function areaField(label: string, valeur: string, onChange: (v: string) => void, max = 2000): HTMLElement {
  const lab = h('label', 'field'); // enveloppe
  lab.appendChild(h('span', 'field-label', label)); // libellé
  const ta = h('textarea'); // zone de texte
  ta.value = valeur; // valeur actuelle
  ta.rows = 3; // hauteur minimale
  ta.maxLength = max; // longueur maximale
  const ajuste = () => {
    ta.style.height = 'auto'; // remet à zéro
    ta.style.height = `${ta.scrollHeight + 2}px`; // s'adapte au contenu
  };
  ta.addEventListener('input', () => { onChange(ta.value); ajuste(); }); // frappe : enregistre et agrandit
  lab.appendChild(ta);
  requestAnimationFrame(ajuste); // ajuste une fois affiché
  return lab;
}

// Compteur avec − et + (zone tactile de 44 px). onChange reçoit la nouvelle valeur.
export function counter(label: string, valeur: number, min: number, max: number, onChange: (v: number) => void, aide?: string): HTMLElement {
  const box = h('div', 'counter'); // conteneur
  box.appendChild(h('span', 'field-label', label)); // libellé
  const row = h('div', 'counter-row'); // ligne − valeur +
  const moins = h('button', 'counter-btn', '−'); // bouton moins
  moins.type = 'button';
  moins.setAttribute('aria-label', `${label} : un de moins`); // pour les lecteurs d'écran
  const out = h('output', 'counter-val', String(valeur)); // valeur
  const plus = h('button', 'counter-btn', '+'); // bouton plus
  plus.type = 'button';
  plus.setAttribute('aria-label', `${label} : un de plus`);
  let v = valeur; // valeur courante
  const maj = () => {
    out.textContent = String(v); // affiche
    moins.disabled = v <= min; // grise au minimum
    plus.disabled = v >= max; // grise au maximum
  };
  moins.addEventListener('click', () => { v = Math.max(min, v - 1); maj(); onChange(v); }); // −1
  plus.addEventListener('click', () => { v = Math.min(max, v + 1); maj(); onChange(v); }); // +1
  maj();
  row.append(moins, out, plus);
  box.appendChild(row);
  if (aide) box.appendChild(h('small', 'field-help', aide)); // petite aide sous le compteur
  return box;
}

// Case à cocher avec libellé. onChange reçoit true / false.
export function checkField(label: string, valeur: boolean, onChange: (v: boolean) => void): HTMLElement {
  const lab = h('label', 'toggle'); // enveloppe
  const c = h('input'); // case
  c.type = 'checkbox';
  c.checked = valeur;
  c.addEventListener('change', () => onChange(c.checked)); // à chaque changement
  lab.append(c, h('span', '', label));
  return lab;
}

// Rangée de pastilles de 1 à max (rang d'une compétence). Toucher la pastille n met le rang à n ; retoucher le rang actuel le baisse d'un cran.
export function dots(label: string, valeur: number, max: number, onChange: (v: number) => void): HTMLElement {
  const row = h('div', 'dots'); // rangée
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', label);
  let v = valeur; // rang courant
  const boutons: HTMLButtonElement[] = []; // pastilles
  const maj = () => boutons.forEach((b, i) => {
    b.classList.toggle('on', i < v); // pleine jusqu'au rang
    b.setAttribute('aria-pressed', String(i < v)); // état pour les lecteurs d'écran
  });
  for (let n = 1; n <= max; n++) {
    const b = h('button', 'dot'); // une pastille
    b.type = 'button';
    b.setAttribute('aria-label', `${label} : rang ${n}`);
    b.addEventListener('click', () => { v = v === n ? n - 1 : n; maj(); onChange(v); }); // choisit ou baisse
    boutons.push(b);
    row.appendChild(b);
  }
  maj();
  return row;
}

// Rangée de cercles numérotés de min à max, un seul choisi (valeur d'un attribut). legendes : mot sous certains nombres (ex. { 2: 'Faible' }).
export function scale(label: string, valeur: number, min: number, max: number, onChange: (v: number) => void, legendes: Record<number, string> = {}): HTMLElement {
  const box = h('div', 'scale-box'); // enveloppe : cercles + légendes
  const row = h('div', 'scale'); // rangée de cercles
  row.setAttribute('role', 'radiogroup');
  row.setAttribute('aria-label', label);
  let v = valeur; // choix courant
  const boutons: HTMLButtonElement[] = [];
  const maj = () => boutons.forEach((b, i) => {
    const sel = min + i === v; // est-ce le choisi ?
    b.classList.toggle('on', sel);
    b.setAttribute('aria-checked', String(sel));
  });
  for (let n = min; n <= max; n++) {
    const b = h('button', 'scale-item'); // un choix
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', `${label} : ${n}`);
    b.append(h('span', 'scale-n', String(n)), h('span', 'scale-c')); // numéro puis cercle
    b.addEventListener('click', () => { v = n; maj(); onChange(v); });
    boutons.push(b);
    row.appendChild(b);
  }
  const leg = h('div', 'scale-legend'); // légendes sous les cercles
  leg.setAttribute('aria-hidden', 'true');
  for (let n = min; n <= max; n++) leg.appendChild(h('span', '', legendes[n] ?? '')); // une case par cercle
  maj();
  box.append(row, leg);
  return box;
}

// Section repliable (<details>) avec son titre.
export function section(titre: string, ouverte: boolean, ...contenu: HTMLElement[]): HTMLDetailsElement {
  const d = h('details', 'sheet-section'); // section
  d.open = ouverte; // ouverte au départ ?
  d.appendChild(h('summary', '', titre)); // titre cliquable
  const corps = h('div', 'sheet-body'); // contenu
  corps.append(...contenu);
  d.appendChild(corps);
  return d;
}
