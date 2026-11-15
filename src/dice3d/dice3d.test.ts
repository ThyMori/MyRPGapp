// Tests de la géométrie des dés et de l'orientation d'atterrissage.
import { describe, expect, it } from 'vitest'; // outils de test
import { Vector3 } from 'three'; // vecteurs 3D
import { CUBE_VALUES, cubeFaces, dodecaFaces, featValuesForFaces } from './faces'; // faces des dés
import { quaternionForFace } from './orientation'; // orientation d'atterrissage

const HAUT = new Vector3(0, 1, 0); // vers le haut de la table
const FOND = new Vector3(0, 0, -1); // vers le haut de l'écran

describe('faces du d12', () => {
  const faces = dodecaFaces(); // les 12 faces
  it('en compte 12, toutes de direction unitaire et différentes', () => {
    expect(faces).toHaveLength(12); // un dodécaèdre a 12 faces
    for (const f of faces) expect(f.normal.length()).toBeCloseTo(1, 5); // normales unitaires
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) expect(faces[i].normal.dot(faces[j].normal)).toBeLessThan(0.99); // directions distinctes
  });
  it('a un « haut de texte » perpendiculaire à chaque face', () => {
    for (const f of faces) {
      expect(f.up.length()).toBeCloseTo(1, 5); // vecteur unitaire
      expect(Math.abs(f.up.dot(f.normal))).toBeLessThan(1e-6); // perpendiculaire à la normale
    }
  });
  it('attribue chaque valeur du dé du Destin une seule fois, avec les faces opposées en paires', () => {
    const valeurs = featValuesForFaces(faces); // valeurs par face
    expect(new Set(valeurs.map(String)).size).toBe(12); // 1 à 10, Œil, Gandalf : 12 valeurs distinctes
    const i = valeurs.indexOf('eye'); // face de l'Œil
    expect(valeurs[faces.findIndex((f) => f.normal.dot(faces[i].normal) < -0.999)]).toBe('gandalf'); // Gandalf est l'opposée
  });
  it('place n’importe quelle face vers le haut, texte à l’endroit', () => {
    for (const f of faces) {
      const q = quaternionForFace(f.normal, f.up); // orientation sans lacet
      expect(f.normal.clone().applyQuaternion(q).distanceTo(HAUT)).toBeLessThan(1e-5); // la face regarde vers le haut
      expect(f.up.clone().applyQuaternion(q).distanceTo(FOND)).toBeLessThan(1e-5); // le haut du texte va vers le haut de l'écran
    }
  });
});

describe('faces du d6', () => {
  const faces = cubeFaces(); // les 6 faces
  it('a des faces opposées qui totalisent 7', () => {
    expect(CUBE_VALUES.length).toBe(6); // six valeurs
    faces.forEach((f, i) => {
      const j = faces.findIndex((g) => g.normal.dot(f.normal) < -0.999); // face opposée
      expect(CUBE_VALUES[i] + CUBE_VALUES[j]).toBe(7); // somme de 7
    });
    expect([...CUBE_VALUES].sort()).toEqual([1, 2, 3, 4, 5, 6]); // chaque valeur une fois
  });
  it('place n’importe quelle face vers le haut, texte à l’endroit', () => {
    for (const f of faces) {
      const q = quaternionForFace(f.normal, f.up); // orientation sans lacet
      expect(f.normal.clone().applyQuaternion(q).distanceTo(HAUT)).toBeLessThan(1e-5); // face vers le haut
      expect(f.up.clone().applyQuaternion(q).distanceTo(FOND)).toBeLessThan(1e-5); // texte à l'endroit
    }
  });
  it('garde la face vers le haut avec un lacet quelconque', () => {
    const f = faces[2]; // une face
    const q = quaternionForFace(f.normal, f.up, 0.4); // avec un lacet
    expect(f.normal.clone().applyQuaternion(q).distanceTo(HAUT)).toBeLessThan(1e-5); // toujours vers le haut
  });
});
