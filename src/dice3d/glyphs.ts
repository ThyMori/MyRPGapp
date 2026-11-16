// Symboles dessinés par l'app (œil, rune de Gandalf, tau de réussite). Dessins originaux, simples, dans un cadre de 100 × 100.
// Chaque symbole = des traits (stroke) et éventuellement des formes pleines (fill), en données de tracé SVG.

// Noms des symboles.
export type GlyphName = 'eye' | 'gandalf' | 'rune';

// Données de tracé de chaque symbole : traits (stroke), formes pleines (fill) et épaisseur de trait (largeur, dans le cadre de 100).
const GLYPHS: Record<GlyphName, { stroke: string[]; fill: string[]; largeur: number }> = {
  eye: {
    largeur: 5,
    stroke: [
      'M6 50 Q50 6 94 50 Q50 94 6 50 Z', // paupières : l'amande de l'œil
      'M50 34 A16 16 0 1 1 49.99 34 Z', // l'iris
      'M30 31 L24 17', 'M50 22 L50 8', 'M70 31 L76 17', // trois flammes au-dessus
      'M30 69 L24 83', 'M50 78 L50 92', 'M70 69 L76 83', // trois flammes en dessous
    ],
    fill: ['M50 37 Q58 50 50 63 Q42 50 50 37 Z'], // pupille en fente verticale
  },
  gandalf: {
    largeur: 7,
    stroke: [
      'M42 94 L42 24', // le bâton
      'M42 24 Q42 8 58 8 Q72 8 72 22 Q72 30 64 32', // sa crosse recourbée
      'M42 58 L74 38', 'M42 58 L74 78', // deux branches de la rune
      'M24 42 L42 58', // éperon de gauche
    ],
    fill: ['M21 31 L27 41 L21 51 L15 41 Z'], // petit losange au bout de l'éperon
  },
  rune: {
    largeur: 11,
    stroke: ['M14 30 Q50 22 86 30', 'M46 27 L46 64 Q46 86 70 80'], // un tau grec (τ) : barre du haut, tige qui s'incurve vers la droite
    fill: [],
  },
};

// Dessine un symbole sur un canevas 2D. (x, y) = centre, size = côté du cadre, color = couleur CSS,
// grow = épaisseur ajoutée au trait, en unités du cadre de 100 (sert à élargir le dessin pour peindre son pourtour).
export function drawGlyph(ctx: CanvasRenderingContext2D, name: GlyphName, x: number, y: number, size: number, color: string, grow = 0): void {
  const g = GLYPHS[name]; // tracés du symbole
  ctx.save(); // sauvegarde l'état du canevas
  ctx.translate(x - size / 2, y - size / 2); // place le coin haut-gauche du cadre
  ctx.scale(size / 100, size / 100); // met à l'échelle le cadre de 100 × 100
  ctx.strokeStyle = color; // couleur des traits
  ctx.fillStyle = color; // couleur des formes pleines
  ctx.lineWidth = g.largeur + grow; // épaisseur du trait (dans le cadre de 100)
  ctx.lineCap = 'round'; // bouts arrondis
  ctx.lineJoin = 'round'; // angles arrondis
  for (const d of g.stroke) ctx.stroke(new Path2D(d)); // trace chaque trait
  for (const d of g.fill) {
    ctx.fill(new Path2D(d)); // remplit chaque forme pleine
    if (grow > 0) ctx.stroke(new Path2D(d)); // et l'élargit si besoin
  }
  ctx.restore(); // restaure l'état du canevas
}

// Fabrique le même symbole sous forme d'élément SVG, pour l'afficher dans la page (couleur = couleur du texte).
export function glyphSvg(name: GlyphName, className = 'glyph'): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg'; // espace de noms SVG
  const svg = document.createElementNS(ns, 'svg'); // élément <svg>
  svg.setAttribute('viewBox', '0 0 100 100'); // cadre de 100 × 100
  svg.setAttribute('class', className); // classe CSS
  svg.setAttribute('aria-hidden', 'true'); // décoratif : le texte voisin porte le sens
  const g = GLYPHS[name]; // tracés du symbole
  for (const d of g.stroke) {
    const p = document.createElementNS(ns, 'path'); // un trait
    p.setAttribute('d', d); // son tracé
    p.setAttribute('fill', 'none'); // pas de remplissage
    p.setAttribute('stroke', 'currentColor'); // couleur du texte
    p.setAttribute('stroke-width', String(g.largeur)); // épaisseur propre au symbole
    p.setAttribute('stroke-linecap', 'round'); // bouts arrondis
    p.setAttribute('stroke-linejoin', 'round'); // angles arrondis
    svg.appendChild(p); // ajoute au svg
  }
  for (const d of g.fill) {
    const p = document.createElementNS(ns, 'path'); // une forme pleine
    p.setAttribute('d', d); // son tracé
    p.setAttribute('fill', 'currentColor'); // remplie avec la couleur du texte
    svg.appendChild(p); // ajoute au svg
  }
  return svg; // élément prêt à insérer
}
