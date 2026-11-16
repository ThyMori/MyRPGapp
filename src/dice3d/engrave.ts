// Gravure : transforme le dessin d'un chiffre ou d'un symbole en carte de relief (« normal map »).
// Fonctions pures sur des tableaux de nombres : testables sans navigateur.

// Flou en boîte, séparable (horizontal puis vertical), de rayon r pixels. Adoucit les bords du dessin pour que la paroi du creux soit en pente.
export function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h); // résultat de la passe horizontale
  const out = new Float32Array(w * h); // résultat final
  const n = 2 * r + 1; // nombre de pixels moyennés
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let somme = 0; // somme des voisins sur la ligne
      for (let k = -r; k <= r; k++) somme += src[y * w + Math.min(w - 1, Math.max(0, x + k))]; // les bords sont prolongés
      tmp[y * w + x] = somme / n; // moyenne
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let somme = 0; // somme des voisins sur la colonne
      for (let k = -r; k <= r; k++) somme += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x]; // les bords sont prolongés
      out[y * w + x] = somme / n; // moyenne
    }
  }
  return out; // image floutée
}

// Calcule la carte de relief d'un creux. profondeur = image de 0 (surface) à 1 (fond du creux), ligne par ligne, du haut vers le bas.
// Rend des octets RGBA : la normale (x, y, z) codée en couleur, comme l'attend Three.js (z = vers l'extérieur de la face).
// force règle l'inclinaison des parois : plus elle est grande, plus la gravure paraît profonde.
export function engraveNormals(profondeur: Float32Array, w: number, h: number, force: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(w * h * 4); // résultat
  const at = (x: number, y: number) => profondeur[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))]; // lecture avec bords prolongés
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) / 2; // pente vers la droite
      const dy = -(at(x, y + 1) - at(x, y - 1)) / 2; // pente vers le haut de l'image (l'axe y de l'image descend, celui de la texture monte)
      // La surface est « -profondeur » : sa normale est (dx, dy, 1) avant normalisation (le creux est en dessous du plan).
      const nx = dx * force;
      const ny = dy * force;
      const l = Math.hypot(nx, ny, 1); // longueur pour normaliser
      const k = (y * w + x) * 4; // position dans le tableau
      rgba[k] = ((nx / l) * 0.5 + 0.5) * 255; // rouge = x
      rgba[k + 1] = ((ny / l) * 0.5 + 0.5) * 255; // vert = y
      rgba[k + 2] = ((1 / l) * 0.5 + 0.5) * 255; // bleu = z
      rgba[k + 3] = 255; // opaque
    }
  }
  return rgba; // image de normales
}
