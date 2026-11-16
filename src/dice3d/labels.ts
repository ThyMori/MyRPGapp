// Fabrique les textures (images) des faces des dés : chiffres, œil, tau… GRAVÉS dans le dé.
// Deux images par face : la couleur (le creux est rouge, le pourtour est peint de la couleur du dé pour se fondre avec lui)
// et le relief (« normal map », calculée par engrave.ts) qui fait accrocher la lumière sur les parois du creux.
import { CanvasTexture, SRGBColorSpace } from 'three'; // texture issue d'un canevas
import type { FeatFace } from '../rules/tor'; // faces du dé du Destin
import { drawGlyph, type GlyphName } from './glyphs'; // symboles dessinés
import type { DicePalette } from './colors'; // palette des dés
import { boxBlur, engraveNormals } from './engrave'; // gravure
import type { DieKind } from './layout'; // type de dé

// Taille du canevas de chaque étiquette, en pixels.
const TAILLE = 256;
// Police des chiffres : gras et très lisible, même quand le dé roule (police de texte de l'app, hébergée).
const POLICE = '"Source Sans 3", system-ui, sans-serif';
// Épaisseur ajoutée autour du dessin pour peindre le pourtour couleur dé (pixels, des deux côtés confondus) : couvre toute la paroi du creux.
const MARGE = 20;
// Rayon du flou qui donne sa pente à la paroi du creux (pixels, appliqué deux fois).
const FLOU = 2;
// Inclinaison des parois : plus c'est grand, plus la gravure est profonde.
const PROFONDEUR = 5;

// Les deux textures d'une face.
export interface LabelTextures {
  map: CanvasTexture; // couleur
  normal: CanvasTexture; // relief
}

// Dessine le contenu d'une face (chiffre ou symbole) d'une seule couleur. grow = épaisseur ajoutée autour du dessin (0 = dessin exact).
function peindre(ctx: CanvasRenderingContext2D, kind: DieKind, face: FeatFace, couleur: string, grow: number): void {
  const c = TAILLE / 2; // centre
  const feat = kind === 'feat'; // d12 ou d6 ?
  const symbole = feat ? 215 : 225; // taille des symboles : presque toute la face
  const trait = (e: number) => e + (grow * 100) / symbole; // épaisseur de trait d'un symbole (cadre de 100), avec l'élargissement
  const symboleSeul = (nom: GlyphName, x: number, y: number, taille: number) => drawGlyph(ctx, nom, x, y, taille, couleur, 13 + (grow * 100) / taille); // un symbole
  if (face === 'eye') {
    drawGlyph(ctx, 'eye', c, c, symbole, couleur, trait(11)); // l'œil de Sauron
    return;
  }
  if (face === 'gandalf') {
    drawGlyph(ctx, 'gandalf', c, c, symbole, couleur, trait(11)); // la rune de Gandalf
    return;
  }
  const six = kind === 'success' && face === 6; // la face 6 du dé de Maîtrise porte aussi le tau de réussite
  let taille = six ? 205 : feat ? 215 : 235; // taille de police de départ : très gros
  ctx.font = `600 ${taille}px ${POLICE}`; // police
  const largeurMax = feat ? 0.78 * TAILLE : 0.8 * TAILLE; // largeur permise (« 10 » doit rester dans la face pentagonale)
  const largeur = ctx.measureText(String(face)).width; // largeur du texte à cette taille
  if (largeur > largeurMax) {
    taille = Math.floor((taille * largeurMax) / largeur); // réduit la police pour que « 10 » tienne
    ctx.font = `600 ${taille}px ${POLICE}`; // police réduite
  }
  const y = c + taille * 0.04 + (six ? 12 : 0); // hauteur du chiffre (le 6 de réussite est un peu descendu pour laisser la place au tau)
  ctx.fillStyle = couleur; // couleur du dessin
  ctx.strokeStyle = couleur; // couleur de l'élargissement
  ctx.lineJoin = 'round'; // angles arrondis
  ctx.lineWidth = grow; // épaisseur de l'élargissement
  ctx.textAlign = 'center'; // centré horizontalement
  ctx.textBaseline = 'middle'; // centré verticalement
  if (grow > 0) ctx.strokeText(String(face), c, y); // élargit le chiffre
  ctx.fillText(String(face), c, y); // écrit le chiffre
  if (face === 6 || face === 9) {
    const bas = y + taille * 0.37; // le soulignement se place juste sous le chiffre
    ctx.fillRect(c - 52 - grow / 2, bas - grow / 2, 104 + grow, 12 + grow); // petit soulignement pour ne pas confondre 6 et 9
  }
  if (six) symboleSeul('rune', 206, 56, 70); // le tau de réussite, en petit, dans le coin en haut à droite
}

// Fabrique les textures gravées d'une face. La face vaut un nombre, 'eye' ou 'gandalf'.
export function makeLabelTextures(kind: DieKind, face: FeatFace, p: DicePalette): LabelTextures {
  const canevas = (): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const c = document.createElement('canvas'); // canevas jetable
    c.width = c.height = TAILLE; // carré
    const x = c.getContext('2d', { willReadFrequently: true }); // contexte de dessin
    if (!x) throw new Error('Canevas 2D indisponible'); // sans canevas, pas d'étiquette
    return [c, x];
  };
  // 1. Couleur : un pourtour de la couleur du dé (invisible sur le dé), puis le creux en rouge.
  const [cCouleur, xCouleur] = canevas();
  peindre(xCouleur, kind, face, p.bodyCss, MARGE); // pourtour élargi, couleur du dé
  peindre(xCouleur, kind, face, p.ink, 0); // le creux lui-même, en rouge
  // 2. Profondeur : le dessin exact en blanc sur fond noir, puis flou pour donner une pente aux parois.
  const [, xMasque] = canevas();
  xMasque.fillStyle = '#000'; // fond noir = surface
  xMasque.fillRect(0, 0, TAILLE, TAILLE);
  peindre(xMasque, kind, face, '#fff', 0); // blanc = creux
  const pixels = xMasque.getImageData(0, 0, TAILLE, TAILLE).data; // relit l'image
  const profondeur = new Float32Array(TAILLE * TAILLE); // profondeur de 0 à 1
  for (let i = 0; i < profondeur.length; i++) profondeur[i] = pixels[i * 4] / 255; // le rouge suffit (image en niveaux de gris)
  const floue = boxBlur(boxBlur(profondeur, TAILLE, TAILLE, FLOU), TAILLE, TAILLE, FLOU); // deux flous successifs ≈ flou gaussien
  // 3. Relief : on transforme les pentes en normales.
  const [cRelief, xRelief] = canevas();
  const img = xRelief.createImageData(TAILLE, TAILLE); // image vide
  img.data.set(engraveNormals(floue, TAILLE, TAILLE, PROFONDEUR)); // remplit avec les normales
  xRelief.putImageData(img, 0, 0); // dépose sur le canevas
  const map = new CanvasTexture(cCouleur); // texture de couleur
  map.colorSpace = SRGBColorSpace; // couleurs correctes à l'écran
  map.anisotropy = 4; // netteté en vue oblique
  const normal = new CanvasTexture(cRelief); // texture de relief (pas de colorSpace : ce sont des données, pas des couleurs)
  normal.anisotropy = 4; // netteté en vue oblique
  return { map, normal }; // textures prêtes à coller
}
