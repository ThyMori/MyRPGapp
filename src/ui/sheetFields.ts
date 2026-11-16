// Petits constructeurs de champs pour la fiche de personnage. Rien n'est jamais écrit avec innerHTML : tout passe par textContent / value.

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
