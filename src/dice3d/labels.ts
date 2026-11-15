// Fabrique les textures (images) collées sur les faces des dés : chiffres, œil, rune.
import { CanvasTexture, SRGBColorSpace } from 'three'; // texture issue d'un canevas
import type { FeatFace } from '../rules/tor'; // faces du dé du Destin
import { drawGlyph } from './glyphs'; // symboles dessinés
import type { DicePalette } from './colors'; // palette des dés
import type { DieKind } from './layout'; // type de dé

// Taille du canevas de chaque étiquette, en pixels.
const TAILLE = 256;

// Fabrique l'étiquette d'une face. La face vaut un nombre, 'eye' ou 'gandalf'.
export function makeLabelTexture(kind: DieKind, face: FeatFace, p: DicePalette): CanvasTexture {
  const canevas = document.createElement('canvas'); // canevas de l'étiquette
  canevas.width = canevas.height = TAILLE; // carré
  const ctx = canevas.getContext('2d'); // contexte de dessin
  if (!ctx) throw new Error('Canevas 2D indisponible'); // sans canevas, pas d'étiquette
  ctx.clearRect(0, 0, TAILLE, TAILLE); // fond transparent
  const c = TAILLE / 2; // centre
  const encre = kind === 'feat' ? p.featInk : p.succInk; // couleur des chiffres selon le dé
  if (face === 'eye') {
    drawGlyph(ctx, 'eye', c, c, 190, p.featEye); // l'œil de Sauron
  } else if (face === 'gandalf') {
    drawGlyph(ctx, 'gandalf', c, c, 190, p.featInk); // la rune de Gandalf
  } else if (kind === 'success' && face === 6) {
    drawGlyph(ctx, 'rune', c, c, 170, p.succRune); // la face 6 du dé de Maîtrise porte la rune
  } else {
    ctx.fillStyle = encre; // couleur du chiffre
    ctx.font = `700 ${kind === 'feat' ? 170 : 190}px "Cormorant Garamond", Georgia, serif`; // police du titre de l'app
    ctx.textAlign = 'center'; // centré horizontalement
    ctx.textBaseline = 'middle'; // centré verticalement
    ctx.fillText(String(face), c, c + 6); // écrit le chiffre (léger décalage optique)
    if (face === 6 || face === 9) {
      ctx.fillRect(c - 46, c + 92, 92, 12); // petit soulignement pour ne pas confondre 6 et 9
    }
  }
  const texture = new CanvasTexture(canevas); // transforme le canevas en texture
  texture.colorSpace = SRGBColorSpace; // couleurs correctes à l'écran
  texture.anisotropy = 4; // netteté en vue oblique
  return texture; // texture prête à coller
}
