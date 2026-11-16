// Dés aux angles arrondis. On part d'une sphère, et on tire chaque point vers la surface d'un « polyèdre adouci » : les faces restent
// parfaitement plates (les chiffres y sont posés), seuls les arêtes et les coins sont arrondis. Le calcul est une fonction pure.
import { IcosahedronGeometry, Vector3, type BufferGeometry } from 'three'; // sphère de départ
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'; // soude les sommets identiques

// Distance du centre à la surface arrondie, dans la direction d (vecteur de longueur 1).
// normals = directions des faces ; h = distance du centre à chaque face ; p = « dureté » des angles (plus p est grand, plus les angles sont vifs).
// Dans la direction d'une face, on retrouve exactement h (face plate) ; près d'une arête, la surface passe un peu en dessous : angle arrondi.
export function roundedRadius(d: [number, number, number], normals: [number, number, number][], h: number, p: number): number {
  let somme = 0; // somme des contributions de chaque face
  for (const n of normals) {
    const c = n[0] * d[0] + n[1] * d[1] + n[2] * d[2]; // cosinus de l'angle entre d et la face
    if (c > 0) somme += Math.pow(c, p); // seules les faces tournées vers d comptent
  }
  return h / Math.pow(somme, 1 / p); // h / (norme p des cosinus)
}

// Fabrique la forme d'un dé arrondi à partir des directions de ses faces.
export function roundedPolyhedron(normals: Vector3[], h: number, p: number): BufferGeometry {
  let g: BufferGeometry = new IcosahedronGeometry(1, 14); // sphère très découpée : de quoi arrondir proprement
  g.deleteAttribute('normal'); // on recalculera les normales
  g.deleteAttribute('uv'); // pas de texture sur le corps
  g = mergeVertices(g); // soude les sommets : ombrage continu, sans coutures
  const pos = g.getAttribute('position'); // sommets de la sphère
  const dirs = normals.map((n) => [n.x, n.y, n.z] as [number, number, number]); // directions de faces en tableaux
  const d: [number, number, number] = [0, 0, 0]; // direction du sommet courant
  for (let i = 0; i < pos.count; i++) {
    d[0] = pos.getX(i); // le sommet de la sphère de rayon 1 est sa propre direction
    d[1] = pos.getY(i);
    d[2] = pos.getZ(i);
    const r = roundedRadius(d, dirs, h, p); // distance à la surface arrondie
    pos.setXYZ(i, d[0] * r, d[1] * r, d[2] * r); // déplace le sommet
  }
  g.computeVertexNormals(); // ombrage lisse
  return g; // forme prête
}
