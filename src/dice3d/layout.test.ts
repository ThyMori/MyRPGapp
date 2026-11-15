// Tests de la disposition des dés.
import { describe, expect, it } from 'vitest'; // outils de test
import { layoutDice, type DieKind } from './layout'; // fonction testée

describe('layoutDice', () => {
  it('place chaque dé, sans doublon de position', () => {
    const kinds: DieKind[] = ['feat', 'feat', 'success', 'success', 'success', 'success', 'success', 'success', 'success', 'success']; // 10 dés
    const { placements } = layoutDice(kinds, 1.2); // écran presque carré
    expect(placements).toHaveLength(10); // un emplacement par dé
    const cles = new Set(placements.map((p) => `${p.x.toFixed(3)}/${p.z.toFixed(3)}`)); // positions uniques
    expect(cles.size).toBe(10); // aucun dé sur un autre
  });
  it('centre la disposition', () => {
    const { placements } = layoutDice(['feat', 'success', 'success', 'success'], 1.5); // 4 dés
    const moyX = placements.reduce((s, p) => s + p.x, 0) / placements.length; // moyenne horizontale
    expect(Math.abs(moyX)).toBeLessThan(1.4); // proche du centre
  });
  it('met le dé du Destin sur la première rangée (en haut)', () => {
    const { placements } = layoutDice(['feat', 'success', 'success'], 1.5); // 3 dés
    expect(placements[0].z).toBeLessThan(placements[1].z); // le dé du Destin est plus haut
  });
  it('met plus de dés par rangée sur un écran large', () => {
    const etroit = layoutDice(['feat', ...Array<DieKind>(6).fill('success')], 0.7); // portrait
    const large = layoutDice(['feat', ...Array<DieKind>(6).fill('success')], 2.2); // paysage
    expect(large.depth).toBeLessThanOrEqual(etroit.depth); // moins de rangées en paysage
  });
  it('gère un seul dé', () => {
    const { placements, width, depth } = layoutDice(['feat'], 1); // un dé
    expect(placements[0]).toEqual({ x: 0, z: 0 }); // au centre
    expect(width).toBeGreaterThan(0); // dimensions positives
    expect(depth).toBeGreaterThan(0); // dimensions positives
  });
});
