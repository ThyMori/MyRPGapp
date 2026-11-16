// Annonce « RÉUSSITE » / « ÉCHEC » façon vieux jeu d'arcade de fantasy héroïque (donjons et dragons des années 80-90) :
// bannière de pierre cerclée d'or, couronne pixel pour la victoire, crâne pixel pour la défaite, braises qui montent.
// Le style (police gothique pixel, or biseauté, cadre) est dans src/styles/omens.css.
const NS = 'http://www.w3.org/2000/svg'; // espace de noms SVG

// Couronne (13 × 8 cases) et crâne (11 × 10 cases) dessinés en pixels : « # » = case pleine.
const COURONNE = ['#.....#.....#', '##...###...##', '###.#####.###', '#############', '#############', '.###########.', '.###########.', '#############'];
const CRANE = ['..#######..', '.#########.', '###########', '##..###..##', '##..###..##', '###########', '.####.####.', '..#######..', '..#.#.#.#..', '..#.#.#.#..'];

// Dessine une image pixel en SVG (une case = un carré, bords nets).
function pixels(motif: string[], classe: string): SVGElement {
  const svg = document.createElementNS(NS, 'svg'); // l'image
  svg.setAttribute('viewBox', `0 0 ${motif[0].length} ${motif.length}`); // une unité = une case
  svg.setAttribute('class', classe); // style
  svg.setAttribute('shape-rendering', 'crispEdges'); // pas de flou entre les cases
  svg.setAttribute('aria-hidden', 'true'); // décoratif
  motif.forEach((ligne, y) => {
    [...ligne].forEach((c, x) => {
      if (c !== '#') return; // case vide
      const r = document.createElementNS(NS, 'rect'); // une case
      r.setAttribute('x', String(x));
      r.setAttribute('y', String(y));
      r.setAttribute('width', '1');
      r.setAttribute('height', '1');
      r.setAttribute('class', y < 2 ? 'arc-px-hi' : 'arc-px'); // les deux premières rangées sont plus claires (reflet)
      svg.appendChild(r);
    });
  });
  return svg;
}

// Petites braises qui montent derrière la bannière (positions et retards tirés au hasard : c'est décoratif).
function braises(): HTMLElement[] {
  return Array.from({ length: 14 }, () => {
    const b = document.createElement('span'); // une braise
    b.className = 'arc-ember';
    b.style.left = `${6 + Math.random() * 88}%`; // position horizontale
    b.style.animationDelay = `${0.3 + Math.random() * 1.6}s`; // elles partent l'une après l'autre
    b.style.setProperty('--taille', `${4 + Math.floor(Math.random() * 3) * 2}px`); // 4, 6 ou 8 px : des carrés de pixels
    return b;
  });
}

// Construit le décor de l'annonce. win = jet réussi ; sous = petite ligne sous le mot (niveau de réussite), vide sinon.
export function buildVerdict(win: boolean, sous: string): HTMLElement {
  const boite = document.createElement('div'); // boîte de l'annonce
  boite.className = `arc-box ${win ? 'arc-win' : 'arc-lose'}`; // couleurs selon le résultat
  boite.setAttribute('role', 'status'); // lue par les lecteurs d'écran
  for (const coin of ['hg', 'hd', 'bg', 'bd']) {
    const p = document.createElement('i'); // rivet doré à chaque coin
    p.className = `arc-rivet arc-${coin}`;
    boite.appendChild(p);
  }
  boite.appendChild(pixels(win ? COURONNE : CRANE, 'arc-icon')); // couronne ou crâne
  const mot = document.createElement('div'); // le mot
  mot.className = 'arc-word';
  mot.setAttribute('aria-label', win ? 'Réussite' : 'Échec'); // lu en entier, pas lettre par lettre
  [...(win ? 'RÉUSSITE' : 'ÉCHEC')].forEach((lettre, i) => {
    const s = document.createElement('span'); // une lettre
    s.className = 'arc-letter';
    s.setAttribute('aria-hidden', 'true'); // l'aria-label du mot suffit
    s.style.animationDelay = `${0.45 + i * 0.06}s`; // le reflet balaie les lettres de gauche à droite
    s.textContent = lettre; // texte fixe, jamais de texte de l'utilisateur
    mot.appendChild(s);
  });
  boite.appendChild(mot);
  const filet = document.createElement('div'); // filet orné sous le mot
  filet.className = 'arc-rule';
  boite.appendChild(filet);
  if (sous) {
    const p = document.createElement('div'); // sous-titre (niveau de réussite)
    p.className = 'arc-sub';
    p.textContent = sous;
    boite.appendChild(p);
  }
  for (const b of braises()) boite.appendChild(b); // braises
  return boite;
}
