// Tests de l'arrondi des dés.
import { describe, expect, it } from 'vitest'; // outils de test
import { roundedRadius } from './rounded'; // fonction testée

// Les six faces d'un cube de côté 1 (distance du centre aux faces : 0,5).
const CUBE: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const norme = (v: number[]) => Math.hypot(v[0], v[1], v[2]); // longueur d'un vecteur

describe('roundedRadius', () => {
  it('garde la face plate : dans la direction d’une face, la distance vaut exactement h', () => {
    expect(roundedRadius([1, 0, 0], CUBE, 0.5, 12)).toBeCloseTo(0.5, 9); // face de droite
    expect(roundedRadius([0, 0, -1], CUBE, 0.5, 12)).toBeCloseTo(0.5, 9); // face de derrière
  });
  it('reste sur le plan de la face tant qu’on est loin des arêtes (étiquettes bien posées)', () => {
    const t = 0.25; // décalage du centre de la face, bien à l'intérieur de la face de demi-côté 0,5
    const d: [number, number, number] = [1, t, 0]; // direction légèrement décalée
    const n = norme(d); // longueur
    const r = roundedRadius([d[0] / n, d[1] / n, d[2] / n], CUBE, 0.5, 12); // distance à la surface
    expect((r * d[0]) / n).toBeCloseTo(0.5, 2); // le point est sur le plan x = 0,5 (à 0,01 près)
  });
  it('arrondit les arêtes et les coins sans jamais dépasser le cube', () => {
    const arete = roundedRadius([Math.SQRT1_2, Math.SQRT1_2, 0], CUBE, 0.5, 12); // direction d'une arête
    expect(arete).toBeLessThan(Math.SQRT1_2); // l'arête vive serait à 0,707 : on est en dessous
    expect(arete).toBeGreaterThan(0.6); // mais l'arrondi reste léger
    const k = 1 / Math.sqrt(3); // direction d'un coin
    const coin = roundedRadius([k, k, k], CUBE, 0.5, 12); // distance au coin
    expect(coin).toBeLessThan(Math.sqrt(3) / 2); // le coin vif serait à 0,866
    expect(coin).toBeLessThan(arete + 0.2); // reste raisonnable
  });
  it('plus p est grand, plus les angles sont vifs', () => {
    const d: [number, number, number] = [Math.SQRT1_2, Math.SQRT1_2, 0]; // arête
    expect(roundedRadius(d, CUBE, 0.5, 30)).toBeGreaterThan(roundedRadius(d, CUBE, 0.5, 8)); // p plus grand → plus proche de l'arête vive
  });
});
