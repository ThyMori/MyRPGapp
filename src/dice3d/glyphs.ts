// Symboles dessinés par l'app (œil, rune de Gandalf, rune de réussite). Dessins originaux, simples, dans un cadre de 100 × 100.
// Chaque symbole = des traits (stroke) et éventuellement des formes pleines (fill), en données de tracé SVG.

// Noms des symboles.
export type GlyphName = 'eye' | 'gandalf' | 'rune';

// Données de tracé de chaque symbole.
const GLYPHS: Record<GlyphName, { stroke: string[]; fill: string[] }> = {
  eye: {
    stroke: ['M8 50 Q50 14 92 50 Q50 86 8 50 Z'], // contour de l'œil
    fill: ['M50 28 Q61 50 50 72 Q39 50 50 28 Z'], // pupille en fente verticale
  },
  gandalf: {
    stroke: ['M40 12 L40 88', 'M40 52 L74 22', 'M40 52 L74 82', 'M22 34 L40 52'], // une tige et trois branches
    fill: [],
  },
  rune: {
    stroke: ['M34 14 L34 86', 'M34 30 Q78 28 78 46 Q78 62 34 62'], // une tige et une boucle
    fill: [],
  },
};

// Dessine un symbole sur un canevas 2D. (x, y) = centre, size = côté du cadre, color = couleur CSS, epaisseur = épaisseur du trait.
export function drawGlyph(ctx: CanvasRenderingContext2D, name: GlyphName, x: number, y: number, size: number, color: string, epaisseur = 8): void {
  const g = GLYPHS[name]; // tracés du symbole
  ctx.save(); // sauvegarde l'état du canevas
  ctx.translate(x - size / 2, y - size / 2); // place le coin haut-gauche du cadre
  ctx.scale(size / 100, size / 100); // met à l'échelle le cadre de 100 × 100
  ctx.strokeStyle = color; // couleur des traits
  ctx.fillStyle = color; // couleur des formes pleines
  ctx.lineWidth = epaisseur; // épaisseur du trait (dans le cadre de 100)
  ctx.lineCap = 'round'; // bouts arrondis
  ctx.lineJoin = 'round'; // angles arrondis
  for (const d of g.stroke) ctx.stroke(new Path2D(d)); // trace chaque trait
  for (const d of g.fill) ctx.fill(new Path2D(d)); // remplit chaque forme pleine
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
    p.setAttribute('stroke-width', '8'); // épaisseur
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
