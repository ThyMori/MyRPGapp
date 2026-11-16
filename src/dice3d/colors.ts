// Lit les couleurs des dés dans les variables CSS (src/styles/tokens.css), pour ne rien coder en dur.
import { Color } from 'three'; // couleur de Three.js

// Convertit n'importe quelle couleur CSS (hsl, rgb, hex…) en [r, g, b] 0-255, grâce à un canevas d'un pixel.
function cssToRgb(css: string): [number, number, number] {
  const c = document.createElement('canvas'); // canevas jetable
  c.width = c.height = 1; // un seul pixel
  const ctx = c.getContext('2d', { willReadFrequently: true }); // contexte 2D
  if (!ctx) return [128, 128, 128]; // repli gris si le canevas est indisponible
  ctx.fillStyle = '#808080'; // valeur de repli si la couleur CSS est invalide
  ctx.fillStyle = css; // le navigateur interprète la couleur CSS
  ctx.fillRect(0, 0, 1, 1); // peint le pixel
  const d = ctx.getImageData(0, 0, 1, 1).data; // relit le pixel en rouge/vert/bleu
  return [d[0], d[1], d[2]]; // composantes 0-255
}

// Lit une variable CSS (ex. "--die-feat-body") et la rend sous forme de chaîne CSS « rgb(r g b) » utilisable partout.
export function readCss(name: string): string {
  const brut = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); // valeur résolue de la variable
  const [r, g, b] = cssToRgb(brut || '#808080'); // normalise en rouge/vert/bleu
  return `rgb(${r}, ${g}, ${b})`; // chaîne CSS standard
}

// Même lecture, mais sous forme de couleur Three.js.
export function readThreeColor(name: string): Color {
  const [r, g, b] = cssToRgb(getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#808080'); // composantes
  return new Color().setRGB(r / 255, g / 255, b / 255, 'srgb'); // couleur dans l'espace sRGB
}

// Palette des dés, lue au moment de l'appel (elle change quand l'utilisateur passe des dés noirs aux dés blancs).
export interface DicePalette {
  body: Color; // corps des dés (noir ou blanc)
  ink: string; // chiffres et symboles (rouge)
}

// Lit toute la palette.
export function readPalette(): DicePalette {
  return {
    body: readThreeColor('--die-body'), // corps des dés
    ink: readCss('--die-ink'), // chiffres et symboles
  };
}
