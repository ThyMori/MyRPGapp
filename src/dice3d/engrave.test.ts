// Tests de la gravure.
import { describe, expect, it } from 'vitest'; // outils de test
import { boxBlur, engraveNormals } from './engrave'; // fonctions testées

// Un carré plein (profondeur 1) de 8 × 8 au milieu d'une image 16 × 16.
function carre(): Float32Array {
  const a = new Float32Array(16 * 16); // image vide
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) a[y * 16 + x] = 1; // le creux
  return a;
}
const px = (d: Uint8ClampedArray, x: number, y: number) => { const k = (y * 16 + x) * 4; return [d[k], d[k + 1], d[k + 2]]; }; // lit un pixel

describe('boxBlur', () => {
  it('garde la somme à peu près constante et adoucit les bords', () => {
    const a = carre(); // image de départ
    const b = boxBlur(a, 16, 16, 1); // floutée
    const somme = (t: Float32Array) => t.reduce((s, v) => s + v, 0); // somme des valeurs
    expect(somme(b)).toBeCloseTo(somme(a), 3); // rien ne se perd (le dessin est loin des bords de l'image)
    expect(b[8 * 16 + 3]).toBeGreaterThan(0); // le bord déborde un peu à l'extérieur
    expect(b[8 * 16 + 4]).toBeLessThan(1); // et s'adoucit à l'intérieur
  });
});

describe('engraveNormals', () => {
  const n = engraveNormals(boxBlur(carre(), 16, 16, 1), 16, 16, 4); // carte de relief du creux
  it('est plate (normale vers l’extérieur) loin du creux et au fond du creux', () => {
    for (const [x, y] of [[0, 0], [15, 15], [8, 8]]) {
      const [r, g, b] = px(n, x, y); // couleur de ce pixel
      expect(r).toBeCloseTo(127.5, -0.5); // pas d'inclinaison en x
      expect(g).toBeCloseTo(127.5, -0.5); // pas d'inclinaison en y
      expect(b).toBeGreaterThan(250); // normale presque parfaitement vers l'extérieur
    }
  });
  it('incline les parois vers l’intérieur du creux : paroi gauche vers la droite, paroi haute vers le bas', () => {
    expect(px(n, 4, 8)[0]).toBeGreaterThan(140); // paroi de gauche : la normale penche vers +x
    expect(px(n, 11, 8)[0]).toBeLessThan(115); // paroi de droite : vers -x
    expect(px(n, 8, 4)[1]).toBeLessThan(115); // paroi du haut (haut de l'image) : la normale penche vers le bas de l'image
    expect(px(n, 8, 11)[1]).toBeGreaterThan(140); // paroi du bas : vers le haut de l'image
  });
});
