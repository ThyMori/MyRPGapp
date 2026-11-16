// Présages : quand l'Œil de Sauron ou la rune de Gandalf sort sur le dé du Destin, une courte scène plein écran s'anime, avec son.
// Les dessins sont construits ici (éléments SVG) ; les mouvements et les couleurs sont dans src/styles/omens.css.
import { playEyeSound, playGandalfSound, stopOmenSound } from '../audio/omenSound'; // sons

export type OmenKind = 'eye' | 'gandalf'; // les deux présages

const DUREE_MS = 2800; // durée de la scène animée
const DUREE_FIXE_MS = 1800; // durée si l'appareil réduit les animations : image fixe, sans mouvement
const NS = 'http://www.w3.org/2000/svg'; // espace de noms SVG

let minuteur = 0; // minuteur de fermeture automatique

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

let racine: HTMLElement | null = null; // calque des présages
let ouvert = false; // un présage est affiché

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
  return ouvert; // état courant
}

// Ferme tout de suite le présage (appui sur l'écran, bouton Retour, nouveau lancer).
export function closeOmen(): void {
  window.clearTimeout(minuteur); // annule la fermeture automatique
  stopOmenSound(); // coupe le son
  ouvert = false; // plus de présage
  if (racine) {
    racine.hidden = true; // cache le calque
    racine.className = 'omen'; // retire les classes d'animation
    racine.replaceChildren(); // vide
  }
}

// Joue un présage. sound = jouer le son ? reduit = l'appareil réduit les animations (image fixe).
export function playOmen(kind: OmenKind, sound: boolean, reduit: boolean): void {
  if (!racine) return; // pas initialisé
  closeOmen(); // un seul présage à la fois
  racine.className = `omen omen-${kind}${reduit ? ' omen-fixe' : ''}`; // classes : type et mode
  racine.replaceChildren(); // repart d'un calque vide
  const lueur = document.createElement('div'); // lueur de fond (rouge ou bleue)
  lueur.className = 'omen-glow'; // style
  const figure = document.createElement('div'); // zone du dessin
  figure.className = 'omen-figure'; // style
  figure.appendChild(kind === 'eye' ? dessinOeil() : dessinBaton()); // le dessin
  racine.append(lueur, figure); // assemble
  if (kind === 'gandalf') for (const s of sparks()) racine.appendChild(s); // étincelles
  racine.hidden = false; // montre
  ouvert = true; // un présage est affiché
  if (sound) (kind === 'eye' ? playEyeSound : playGandalfSound)(); // le son qui va avec
  minuteur = window.setTimeout(closeOmen, reduit ? DUREE_FIXE_MS : DUREE_MS); // ferme à la fin de la scène
}

// Branche le calque : un appui n'importe où ferme le présage.
export function initOmens(): void {
  racine = document.getElementById('omen'); // le calque (dans index.html)
  racine?.addEventListener('click', closeOmen); // un appui ferme
}
