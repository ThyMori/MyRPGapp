// Faces des dés : direction de chaque face, sens de lecture du texte, valeur écrite dessus.
import { DodecahedronGeometry, Vector3 } from 'three'; // géométrie du d12 et vecteurs 3D
import type { FeatFace } from '../rules/tor'; // faces possibles du dé du Destin

// Description d'une face.
export interface FaceInfo {
  normal: Vector3; // direction perpendiculaire à la face, vers l'extérieur
  up: Vector3; // « haut » du texte écrit sur la face (perpendiculaire à normal)
  center: Vector3; // centre de la face
}

// Clé d'arrondi pour reconnaître deux sommets identiques malgré les imprécisions de calcul.
const cle = (v: Vector3) => `${v.x.toFixed(4)}|${v.y.toFixed(4)}|${v.z.toFixed(4)}`;

// Les 12 faces d'un dodécaèdre de rayon 1. Chaque face pentagonale est faite de 3 triangles : on les regroupe par direction.
export function dodecaFaces(): FaceInfo[] {
  const g = new DodecahedronGeometry(1, 0); // dodécaèdre de rayon 1
  const pos = g.getAttribute('position'); // sommets
  const index = g.getIndex(); // liste d'indices (peut être absente)
  const nbSommets = index ? index.count : pos.count; // nombre de sommets à parcourir
  const lire = (k: number) => new Vector3().fromBufferAttribute(pos, index ? index.getX(k) : k); // lit le sommet k
  const groupes: { normal: Vector3; sommets: Map<string, Vector3> }[] = []; // faces en construction
  for (let t = 0; t < nbSommets; t += 3) {
    const a = lire(t); // premier sommet du triangle
    const b = lire(t + 1); // deuxième
    const c = lire(t + 2); // troisième
    const n = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize(); // normale du triangle
    if (n.dot(a) < 0) n.negate(); // la normale doit pointer vers l'extérieur (le centre du dé est l'origine)
    let groupe = groupes.find((x) => x.normal.dot(n) > 0.999); // face déjà connue ?
    if (!groupe) {
      groupe = { normal: n, sommets: new Map() }; // nouvelle face
      groupes.push(groupe); // on l'ajoute
    }
    for (const s of [a, b, c]) groupe.sommets.set(cle(s), s); // mémorise les sommets distincts de la face
  }
  const faces: FaceInfo[] = groupes.map((gr) => {
    const sommets = [...gr.sommets.values()]; // sommets distincts
    const center = sommets.reduce((s, v) => s.add(v), new Vector3()).divideScalar(sommets.length); // centre = moyenne des sommets
    const vers = sommets[0].clone().sub(center); // direction du centre vers un sommet
    const up = vers.sub(gr.normal.clone().multiplyScalar(vers.dot(gr.normal))).normalize(); // composante perpendiculaire à la normale
    return { normal: gr.normal.clone(), up, center }; // description de la face
  });
  // Tri stable : de haut en bas, puis gauche-droite, pour que le même numéro tombe toujours sur la même face.
  faces.sort((p, q) => q.normal.y - p.normal.y || q.normal.x - p.normal.x || q.normal.z - p.normal.z);
  g.dispose(); // libère la géométrie temporaire
  return faces; // 12 faces
}

// Les 6 faces d'un cube de côté 1. L'ordre définit la valeur : voir CUBE_VALUES.
export function cubeFaces(): FaceInfo[] {
  const def: [number[], number[]][] = [
    [[0, 1, 0], [0, 0, -1]], // dessus : le haut du texte va vers l'arrière
    [[0, -1, 0], [0, 0, 1]], // dessous
    [[1, 0, 0], [0, 1, 0]], // droite
    [[-1, 0, 0], [0, 1, 0]], // gauche
    [[0, 0, 1], [0, 1, 0]], // devant
    [[0, 0, -1], [0, 1, 0]], // derrière
  ];
  return def.map(([n, u]) => {
    const normal = new Vector3(n[0], n[1], n[2]); // direction de la face
    return { normal, up: new Vector3(u[0], u[1], u[2]), center: normal.clone().multiplyScalar(0.5) }; // le centre est à une demi-arête
  });
}

// Valeurs d'un d6, dans l'ordre de cubeFaces() : deux faces opposées font toujours 7.
export const CUBE_VALUES: number[] = [1, 6, 2, 5, 3, 4];

// Valeurs du d12 du Destin : on associe les faces opposées par paires (1/10, 2/9, 3/8, 4/7, 5/6, Œil/Gandalf).
export function featValuesForFaces(faces: FaceInfo[]): FeatFace[] {
  const paires: [FeatFace, FeatFace][] = [[1, 10], [2, 9], [3, 8], [4, 7], [5, 6], ['eye', 'gandalf']]; // paires de faces opposées
  const valeurs: (FeatFace | undefined)[] = new Array(faces.length).fill(undefined); // valeur de chaque face
  let p = 0; // paire en cours
  for (let i = 0; i < faces.length; i++) {
    if (valeurs[i] !== undefined) continue; // face déjà attribuée
    const j = faces.findIndex((f, k) => k !== i && f.normal.dot(faces[i].normal) < -0.999); // face opposée
    valeurs[i] = paires[p][0]; // première valeur de la paire
    valeurs[j] = paires[p][1]; // seconde valeur sur la face opposée
    p++; // paire suivante
  }
  return valeurs as FeatFace[]; // toutes les faces ont une valeur
}
