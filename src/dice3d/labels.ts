// Fabrique les textures (images) collées sur les faces des dés : chiffres, œil, rune. Tout est en rouge (couleur --die-ink).
import { CanvasTexture, SRGBColorSpace } from 'three'; // texture issue d'un canevas
import type { FeatFace } from '../rules/tor'; // faces du dé du Destin
import { drawGlyph } from './glyphs'; // symboles dessinés
import type { DicePalette } from './colors'; // palette des dés
import type { DieKind } from './layout'; // type de dé

// Taille du canevas de chaque étiquette, en pixels.
const TAILLE = 256;
// Police des chiffres : gras et très lisible, même quand le dé roule (police de texte de l'app, hébergée).
const POLICE = '"Source Sans 3", system-ui, sans-serif';

// Fabrique l'étiquette d'une face. La face vaut un nombre, 'eye' ou 'gandalf'.
export function makeLabelTexture(kind: DieKind, face: FeatFace, p: DicePalette): CanvasTexture {
  const canevas = document.createElement('canvas'); // canevas de l'étiquette
  canevas.width = canevas.height = TAILLE; // carré
  const ctx = canevas.getContext('2d'); // contexte de dessin
  if (!ctx) throw new Error('Canevas 2D indisponible'); // sans canevas, pas d'étiquette
  ctx.clearRect(0, 0, TAILLE, TAILLE); // fond transparent
  const c = TAILLE / 2; // centre
  const feat = kind === 'feat'; // d12 ou d6 ?
  const symbole = feat ? 215 : 225; // taille des symboles : presque toute la face
  if (face === 'eye') {
    drawGlyph(ctx, 'eye', c, c, symbole, p.ink, 11); // l'œil de Sauron
  } else if (face === 'gandalf') {
    drawGlyph(ctx, 'gandalf', c, c, symbole, p.ink, 11); // la rune de Gandalf
  } else if (kind === 'success' && face === 6) {
    drawGlyph(ctx, 'rune', c, c, symbole - 10, p.ink, 11); // la face 6 du dé de Maîtrise porte la rune
  } else {
    ctx.fillStyle = p.ink; // couleur du chiffre
    let taille = feat ? 215 : 235; // taille de police de départ : très gros
    ctx.font = `600 ${taille}px ${POLICE}`; // police
    const largeurMax = feat ? 0.78 * TAILLE : 0.8 * TAILLE; // largeur permise (« 10 » doit rester dans la face pentagonale)
    const largeur = ctx.measureText(String(face)).width; // largeur du texte à cette taille
    if (largeur > largeurMax) {
      taille = Math.floor((taille * largeurMax) / largeur); // réduit la police pour que « 10 » tienne
      ctx.font = `600 ${taille}px ${POLICE}`; // police réduite
    }
    ctx.textAlign = 'center'; // centré horizontalement
    ctx.textBaseline = 'middle'; // centré verticalement
    ctx.fillText(String(face), c, c + taille * 0.04); // écrit le chiffre (léger décalage optique)
    if (face === 6 || face === 9) {
      ctx.fillRect(c - 52, c + taille * 0.5, 104, 14); // petit soulignement pour ne pas confondre 6 et 9
    }
  }
  const texture = new CanvasTexture(canevas); // transforme le canevas en texture
  texture.colorSpace = SRGBColorSpace; // couleurs correctes à l'écran
  texture.anisotropy = 4; // netteté en vue oblique
  return texture; // texture prête à coller
}
