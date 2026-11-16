// Présages : quand l'Œil de Sauron ou la rune de Gandalf sort sur le dé du Destin, une courte scène plein écran s'anime, avec son.
// Les dessins sont construits ici (éléments SVG) ; les mouvements et les couleurs sont dans src/styles/omens.css.
import { playEyeSound, playGandalfSound, playTauSound, stopOmenSound } from '../audio/omenSound'; // sons
import { buildVerdict } from './verdict'; // décor de l'annonce
import { OmenGL } from '../omen3d/OmenGL'; // rendu 3D (shaders)
import { tauDuree } from '../omen3d/timeline'; // durée de la fête des tau
import { fxLevel } from './prefs'; // niveau des effets

export type OmenKind = 'eye' | 'gandalf' | 'tau'; // les présages et la fête des runes de réussite

// Une scène à jouer : pour les tau, niveau (1 sympa, 2 grandiose, 3 épique) et nombre de tau dessinés.
export interface Scene {
  kind: OmenKind | 'verdict' | 'pause'; // type de scène (« verdict » = annonce Réussite / Échec, « pause » = attente sans rien afficher)
  win?: boolean; // verdict : jet réussi ?
  sous?: string; // verdict : ligne sous le mot (niveau de réussite)
  ms?: number; // pause : durée en millisecondes
  tier?: number; // niveau de la fête (tau seulement)
  n?: number; // nombre de tau (tau seulement)
}

const DUREE_MS = 2800; // durée de la scène animée
const VERDICT_MS = 2400; // durée de l'annonce Réussite / Échec
const DUREE_FIXE_MS = 1800; // durée si l'appareil réduit les animations : image fixe, sans mouvement
const NS = 'http://www.w3.org/2000/svg'; // espace de noms SVG

let minuteur = 0; // minuteur de fin de scène
let file: Scene[] = []; // scènes en attente (elles se jouent l'une après l'autre)
let avecSon = false; // jouer le son des scènes suivantes ?
let animReduite = false; // l'appareil réduit les animations ?

// Crée un élément SVG avec ses attributs.
function el(nom: string, attrs: Record<string, string> = {}, classe?: string): SVGElement {
  const e = document.createElementNS(NS, nom); // l'élément
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); // ses attributs
  if (classe) e.setAttribute('class', classe); // sa classe CSS (les couleurs sont dans le CSS)
  return e;
}

// Un dégradé radial dont les arrêts ont une classe CSS (donc une couleur issue des variables du CSS).
function degrade(id: string, stops: [number, string][]): SVGElement {
  const g = el('radialGradient', { id }); // le dégradé
  for (const [offset, classe] of stops) g.appendChild(el('stop', { offset: `${offset}%` }, classe)); // ses arrêts
  return g;
}

// Dessin de l'Œil : amande de paupières, iris de feu, pupille en fente, flammes autour.
function dessinOeil(): SVGElement {
  const svg = el('svg', { viewBox: '0 0 200 140', class: 'omen-svg omen-eye-svg', 'aria-hidden': 'true' });
  const defs = el('defs'); // définitions (dégradés)
  defs.append(degrade('omen-iris', [[0, 'stop-gold'], [55, 'stop-fire'], [100, 'stop-ember']]), degrade('omen-sclera', [[0, 'stop-fire'], [100, 'stop-dark']]));
  svg.appendChild(defs);
  const flammes = el('g', { transform: 'translate(100 70)' }, 'omen-flames'); // couronne de flammes, centrée sur l'Œil
  const angles = [-75, -55, -35, -18, 0, 18, 35, 55, 75]; // flammes du haut
  [...angles, ...angles.map((x) => x + 180)].forEach((a, i) => {
    const pivot = el('g', { transform: `rotate(${a})` }); // groupe qui porte la rotation (le CSS animera la flamme à l'intérieur)
    const f = el('path', { d: 'M-5 -58 Q0 -88 5 -58 Q0 -64 -5 -58 Z' }, 'omen-flame'); // une flamme
    (f as SVGElement & ElementCSSInlineStyle).style.animationDelay = `${(i % 5) * 0.07}s`; // les flammes ne vacillent pas toutes en même temps
    pivot.appendChild(f); // la flamme dans son pivot
    flammes.appendChild(pivot); // le pivot dans la couronne
  });
  svg.appendChild(flammes);
  const paupiere = el('g', {}, 'omen-lid'); // l'œil qui s'ouvre (la forme se déplie du centre)
  paupiere.append(
    el('path', { d: 'M10 70 Q100 -10 190 70 Q100 150 10 70 Z' }, 'omen-sclera'), // amande
    el('ellipse', { cx: '100', cy: '70', rx: '34', ry: '34' }, 'omen-iris'), // iris
    el('path', { d: 'M100 32 Q114 70 100 108 Q86 70 100 32 Z' }, 'omen-pupil'), // pupille en fente verticale, qui bouge
  );
  svg.appendChild(paupiere);
  return svg;
}

// Dessin du bâton de Gandalf : bâton noueux, crosse recourbée, cristal bleu qui s'allume, rayons, étincelles.
function dessinBaton(): SVGElement {
  const svg = el('svg', { viewBox: '0 0 120 200', class: 'omen-svg omen-staff-svg', 'aria-hidden': 'true' });
  const defs = el('defs'); // définitions
  defs.append(degrade('omen-orb', [[0, 'stop-white'], [45, 'stop-ice'], [100, 'stop-blue']]), degrade('omen-halo', [[0, 'stop-halo'], [100, 'stop-clear']]));
  svg.appendChild(defs);
  const centre = el('g', { transform: 'translate(60 30)' }); // place les rayons sur le cristal
  const rayons = el('g', {}, 'omen-rays'); // groupe qui tourne (animé par le CSS)
  for (let i = 0; i < 12; i++) rayons.appendChild(el('path', { d: 'M-3 -14 L0 -62 L3 -14 Z', transform: `rotate(${i * 30})` }, 'omen-ray')); // un rayon
  centre.appendChild(rayons); // les rayons dans leur support
  svg.append(el('circle', { cx: '60', cy: '30', r: '58' }, 'omen-halo'), centre);
  svg.appendChild(el('path', { d: 'M64 196 Q58 130 66 80 Q70 58 60 44 M60 46 Q42 42 46 22 M60 46 Q78 42 74 22', fill: 'none' }, 'omen-wood')); // le bâton : tronc et crosse recourbée
  svg.appendChild(el('circle', { cx: '60', cy: '30', r: '11' }, 'omen-orb')); // le cristal
  return svg;
}


// Dessin plat d'un tau d'or (repli sans 3D) : le nombre de tau suit le nombre de runes, chacun apparaît à son tour.
function dessinTau(n: number): SVGElement {
  const svg = el('svg', { viewBox: `0 0 ${n * 80} 100`, class: 'omen-svg omen-tau-svg', 'aria-hidden': 'true' });
  for (let i = 0; i < n; i++) {
    const g = el('g', { transform: `translate(${i * 80 + 10} 8)` }); // place le tau i
    const trace = el('g', {}, 'omen-tau-glyph'); // groupe animé (le CSS le fait apparaître)
    (trace as SVGElement & ElementCSSInlineStyle).style.animationDelay = `${0.2 + i * 0.28}s`; // chacun à son tour
    trace.append(el('path', { d: 'M4 20 L56 20' }, 'omen-tau-line'), el('path', { d: 'M30 20 L30 62 Q30 80 46 78' }, 'omen-tau-line')); // barre et jambage
    g.appendChild(trace);
    svg.appendChild(g);
  }
  return svg;
}

let racine: HTMLElement | null = null; // calque des présages
let canvas3d: HTMLCanvasElement | null = null; // canvas du rendu 3D (créé au premier besoin)
let moteur: OmenGL | null | undefined; // moteur 3D (undefined = pas encore essayé, null = indisponible)
let ouvert = false; // un présage est affiché
let voile: HTMLElement | null = null; // calque de l'annonce Réussite / Échec (au-dessus des présages)
let minuteurVerdict = 0; // minuteur de fin de l'annonce

// Fabrique les petites étincelles (éléments HTML) du présage de Gandalf.
function sparks(): HTMLElement[] {
  return Array.from({ length: 16 }, () => {
    const s = document.createElement('span'); // une étincelle
    s.className = 'omen-spark'; // style
    s.style.left = `${8 + Math.random() * 84}%`; // position horizontale
    s.style.top = `${30 + Math.random() * 55}%`; // position verticale de départ
    s.style.animationDelay = `${0.8 + Math.random() * 1.3}s`; // elles apparaissent l'une après l'autre
    s.style.setProperty('--taille', `${5 + Math.random() * 8}px`); // taille
    return s;
  });
}

// Un présage est-il affiché ?
export function isOmenOpen(): boolean {
  return ouvert || (voile !== null && !voile.hidden); // présage ou annonce affichés
}

// Efface la scène affichée (sans toucher à la file d'attente).
function fermer(): void {
  window.clearTimeout(minuteur); // annule la fin automatique
  moteur?.stop(); // arrête le rendu 3D
  stopOmenSound(); // coupe le son
  ouvert = false; // plus de scène
  if (racine) {
    racine.hidden = true; // cache le calque
    racine.className = 'omen'; // retire les classes d'animation
    racine.replaceChildren(); // vide
    void racine.offsetWidth; // force le navigateur à appliquer l'état caché : l'animation CSS de la scène suivante repart de zéro
  }
}

// Ferme tout de suite et annule les scènes en attente (appui sur l'écran, bouton Retour, nouveau lancer).
export function closeOmen(): void {
  file = []; // plus rien à enchaîner
  fermerVerdict(); // efface l'annonce
  fermer(); // efface la scène
}

// Efface l'annonce Réussite / Échec.
function fermerVerdict(): void {
  window.clearTimeout(minuteurVerdict); // annule sa fin automatique
  if (voile) {
    voile.hidden = true; // cache le calque
    voile.className = 'verdict-layer'; // retire les classes
    voile.replaceChildren(); // vide
  }
}

// Affiche l'annonce par-dessus ce qui est déjà à l'écran, sans toucher aux présages.
function jouerVerdict(sc: Scene, reduit: boolean): void {
  if (!voile) return; // pas initialisé
  fermerVerdict(); // repart de zéro
  voile.className = `verdict-layer${reduit ? ' omen-fixe' : ''}`; // calque de l'annonce
  voile.appendChild(buildVerdict(sc.win === true, sc.sous ?? '')); // le décor
  voile.hidden = false; // montre
  minuteurVerdict = window.setTimeout(fermerVerdict, dureeMs(sc, reduit)); // fin de l'annonce, indépendante des présages
}

// Durée totale : l'annonce joue en même temps que les présages, qui eux s'enchaînent ; on prend la plus longue.
export function dureeTotaleMs(scenes: Scene[], reduit: boolean): number {
  const verdict = Math.max(0, ...scenes.filter((s) => s.kind === 'verdict').map((s) => dureeMs(s, reduit))); // l'annonce
  const autres = scenes.filter((s) => s.kind !== 'verdict').reduce((a, s) => a + dureeMs(s, reduit), 0); // la suite des présages
  return Math.max(verdict, autres); // la plus longue des deux
}

// Tente de jouer la scène en 3D (shaders). Rend false si l'appareil ne sait pas (les dessins plats prennent le relais).
function jouer3d(sc: Scene, kind: OmenKind): boolean {
  if (!racine) return false; // pas initialisé
  if (!canvas3d) {
    canvas3d = document.createElement('canvas'); // canvas du rendu
    canvas3d.className = 'omen-canvas'; // style
  }
  racine.className = `omen omen-gl omen-${kind}`; // calque en mode 3D
  racine.appendChild(canvas3d); // le canvas doit être dans la page pour avoir une taille
  if (moteur === undefined) moteur = OmenGL.create(canvas3d); // crée le moteur une seule fois
  if (moteur && moteur.start(kind, fxLevel(), { tier: sc.tier ?? 1, n: sc.n ?? 1 })) return true; // la scène tourne
  racine.replaceChildren(); // échec : retire le canvas
  return false; // repli
}

// Durée d'une scène en millisecondes.
export function dureeMs(sc: Scene, reduit = animReduite): number {
  if (sc.kind === 'pause') return sc.ms ?? 0; // attente
  if (sc.kind === 'verdict') return reduit ? DUREE_FIXE_MS : VERDICT_MS; // annonce
  if (reduit) return DUREE_FIXE_MS; // image fixe : courte
  return sc.kind === 'tau' ? tauDuree(sc.tier ?? 1) * 1000 : DUREE_MS; // fête : selon le niveau
}

// Joue la scène suivante de la file, ou ferme s'il n'y en a plus.
function suivante(): void {
  const sc = file.shift(); // prochaine scène
  if (!sc || !racine) {
    fermer(); // fini
    return;
  }
  fermer(); // efface la scène précédente
  if (sc.kind === 'pause') {
    minuteur = window.setTimeout(suivante, dureeMs(sc)); // on attend, sans rien montrer
    return;
  }
  if (sc.kind === 'verdict') {
    suivante(); // l'annonce n'a pas sa place dans la file : on passe
    return;
  }
  const kind = sc.kind; // présage ou fête
  const son = () => {
    if (!avecSon) return; // son coupé
    if (kind === 'eye') playEyeSound(); // l'Œil
    else if (kind === 'gandalf') playGandalfSound(); // le bâton
    else playTauSound(sc.tier ?? 1, sc.n ?? 1); // la fête des tau
  };
  const fin = window.setTimeout(suivante, dureeMs(sc)); // fin de la scène, puis la suivante
  if (!animReduite && fxLevel() !== 'off' && jouer3d(sc, kind)) {
    racine.hidden = false; // montre le calque
    ouvert = true; // une scène est affichée
    son(); // le son qui va avec
    minuteur = fin; // mémorise pour pouvoir annuler
    return; // la scène 3D tourne
  }
  racine.className = `omen omen-${sc.kind}${animReduite ? ' omen-fixe' : ''}${sc.kind === 'tau' ? ` omen-tier${sc.tier ?? 1}` : ''}`; // repli : dessins plats
  const lueur = document.createElement('div'); // lueur de fond
  lueur.className = 'omen-glow'; // style
  const figure = document.createElement('div'); // zone du dessin
  figure.className = 'omen-figure'; // style
  figure.appendChild(sc.kind === 'eye' ? dessinOeil() : sc.kind === 'gandalf' ? dessinBaton() : dessinTau(sc.n ?? 1)); // le dessin
  racine.append(lueur, figure); // assemble
  if (sc.kind === 'gandalf') for (const sp of sparks()) racine.appendChild(sp); // étincelles
  racine.hidden = false; // montre
  ouvert = true; // une scène est affichée
  son(); // le son
  minuteur = fin; // mémorise
}

// Joue une ou plusieurs scènes l'une après l'autre. sound = jouer le son ? reduit = l'appareil réduit les animations (image fixe).
export function playOmens(scenes: Scene[], sound: boolean, reduit: boolean): void {
  if (!racine || scenes.length === 0) return; // rien à jouer
  avecSon = sound; // son ou non
  animReduite = reduit; // animations réduites ou non
  const verdict = scenes.find((s) => s.kind === 'verdict'); // l'annonce, jouée à part et en même temps
  file = scenes.filter((s) => s.kind !== 'verdict'); // les présages, l'un après l'autre
  if (verdict) jouerVerdict(verdict, reduit); // par-dessus tout le reste
  suivante(); // lance le premier présage (ferme proprement s'il n'y en a pas)
}

// Joue un seul présage (raccourci).
export function playOmen(kind: OmenKind, sound: boolean, reduit: boolean): void {
  playOmens([{ kind }], sound, reduit); // une scène
}

// Branche le calque : un appui n'importe où ferme tout.
export function initOmens(): void {
  racine = document.getElementById('omen'); // le calque (dans index.html)
  racine?.addEventListener('click', closeOmen); // un appui ferme
  voile = document.createElement('div'); // calque de l'annonce, créé ici
  voile.id = 'verdict'; // repère
  voile.className = 'verdict-layer'; // style
  voile.hidden = true; // caché au départ
  voile.setAttribute('aria-live', 'polite'); // annoncé aux lecteurs d'écran
  voile.addEventListener('click', closeOmen); // un appui ferme tout
  document.body.appendChild(voile); // dans la page
}
