// Tests du flétrissement des dés.
import { describe, expect, it } from 'vitest'; // outils de test
import { BATTEMENTS, WITHER_DUREE_S, witherState } from './wither'; // fonctions testées

describe('witherState', () => {
  it('commence intact et finit flétri', () => {
    expect(witherState(0).wither).toBe(0); // intact
    expect(witherState(WITHER_DUREE_S).wither).toBe(1); // flétri
  });
  it('ne se rétablit jamais (le flétrissement ne fait que croître)', () => {
    let prec = 0;
    for (let t = 0; t <= WITHER_DUREE_S; t += 0.02) {
      const w = witherState(t).wither;
      expect(w).toBeGreaterThanOrEqual(prec); // jamais en arrière
      prec = w;
    }
  });
  it('bat de plus en plus faiblement et de plus en plus lentement', () => {
    expect(witherState(BATTEMENTS[0][0]).beat).toBeCloseTo(1); // premier battement franc
    expect(witherState(2.4).beat).toBeLessThan(0.4); // dernier battement faible
    for (let t = 0; t <= WITHER_DUREE_S; t += 0.02) {
      const b = witherState(t).beat;
      expect(b).toBeGreaterThanOrEqual(0); // jamais négatif
      expect(b).toBeLessThanOrEqual(1); // jamais au-dessus de 1
    }
    const forces = BATTEMENTS.map((b) => b[1]);
    expect(forces[forces.length - 1]).toBeLessThan(forces[0]); // la force baisse
  });
});
