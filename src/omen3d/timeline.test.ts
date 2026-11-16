// Tests de la chronologie des présages.
import { describe, expect, it } from 'vitest'; // outils de test
import { DUREE_S, cles, eyeState, gandalfState, lisse } from './timeline'; // fonctions testées

describe('lisse et cles', () => {
  it('lisse va de 0 à 1 sans dépasser', () => {
    expect(lisse(1, 2, 0)).toBe(0); // avant
    expect(lisse(1, 2, 1.5)).toBeCloseTo(0.5); // milieu
    expect(lisse(1, 2, 3)).toBe(1); // après
  });
  it('cles passe par ses points', () => {
    const k: [number, number][] = [[0, 0], [1, 5], [2, 1]];
    expect(cles(-1, k)).toBe(0); // avant le début
    expect(cles(1, k)).toBeCloseTo(5); // sur un point
    expect(cles(9, k)).toBe(1); // après la fin
  });
});

describe('eyeState', () => {
  it("commence fermé et invisible, finit invisible", () => {
    expect(eyeState(0).open).toBe(0); // fermé
    expect(eyeState(0).fade).toBe(0); // invisible
    expect(eyeState(DUREE_S).fade).toBeCloseTo(0); // s'éteint
  });
  it("est ouvert, regarde droit et se dilate après le coup de cor", () => {
    const s = eyeState(2.1);
    expect(s.open).toBe(1); // ouvert
    expect(s.pupilX).toBeCloseTo(0); // regard centré
    expect(s.dilate).toBeGreaterThan(0.3); // pupille qui grandit
    expect(s.shake).toBeGreaterThan(0); // tremblement
    expect(eyeState(1.0).shake).toBe(0); // pas de tremblement avant le cor
  });
  it('garde toutes les valeurs entre 0 et 1 (sauf le regard)', () => {
    for (let t = 0; t <= DUREE_S; t += 0.05) {
      const s = eyeState(t);
      for (const v of [s.open, s.dilate, s.pulse, s.shake, s.flash, s.fade]) {
        expect(v).toBeGreaterThanOrEqual(0); // jamais négatif
        expect(v).toBeLessThanOrEqual(1); // jamais au-dessus de 1
      }
      expect(Math.abs(s.pupilX)).toBeLessThanOrEqual(0.3 + 1e-9); // le regard reste dans l'œil
    }
  });
});

describe('gandalfState', () => {
  it("n'a pas d'onde avant le carillon puis la fait partir", () => {
    expect(gandalfState(0.3).ring).toBe(-1); // pas encore
    expect(gandalfState(1.0).ring).toBeCloseTo(0.4); // 0,4 s après le carillon
  });
  it("monte, s'allume et s'éteint", () => {
    expect(gandalfState(0).rise).toBe(0); // bâton en bas
    expect(gandalfState(1).ignite).toBe(1); // cristal allumé
    expect(gandalfState(DUREE_S).fade).toBeCloseTo(0); // fondu final
  });
});

import { tauArrivee, tauDuree, tauState } from './timeline'; // fête des tau

describe('tauState', () => {
  it('dure plus longtemps à mesure que la fête grandit', () => {
    expect(tauDuree(1)).toBeLessThan(tauDuree(2)); // grandiose > sympa
    expect(tauDuree(2)).toBeLessThan(tauDuree(3)); // épique > grandiose
  });
  it('commence et finit invisible, avec des valeurs entre 0 et 1', () => {
    for (const tier of [1, 2, 3]) {
      const d = tauDuree(tier);
      expect(tauState(0, tier, 3).fade).toBe(0); // invisible au début
      expect(tauState(d, tier, 3).fade).toBeCloseTo(0); // invisible à la fin
      for (let t = 0; t <= d; t += 0.05) {
        const s = tauState(t, tier, 4);
        for (const v of [s.fade, s.flash, s.shake]) {
          expect(v).toBeGreaterThanOrEqual(0); // jamais négatif
          expect(v).toBeLessThanOrEqual(1 + 1e-9); // jamais au-dessus de 1
        }
      }
    }
  });
  it("l'épique tremble plus fort que le sympa", () => {
    const max = (tier: number) => Math.max(...Array.from({ length: 80 }, (_, k) => tauState(k * 0.05, tier, 3).shake));
    expect(max(1)).toBe(0); // sympa : aucun tremblement
    expect(max(3)).toBeGreaterThan(max(2)); // épique > grandiose
  });
  it('fait arriver les tau les uns après les autres', () => {
    expect(tauArrivee(1)).toBeGreaterThan(tauArrivee(0)); // dans l'ordre
  });
});
