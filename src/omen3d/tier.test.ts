// Tests du niveau de célébration.
import { describe, expect, it } from 'vitest'; // outils de test
import { TAU_MAX, tauShown, tauTier } from './tier'; // fonctions testées

describe('tauTier', () => {
  it('fête 1, 2, puis 3 runes ou plus', () => {
    expect(tauTier(1, true)).toBe(1); // sympa
    expect(tauTier(2, true)).toBe(2); // grandiose
    expect(tauTier(3, true)).toBe(3); // épique
    expect(tauTier(8, true)).toBe(3); // épique aussi
  });
  it("ne fête rien sans rune ou sur un échec", () => {
    expect(tauTier(0, true)).toBe(0); // aucune rune
    expect(tauTier(3, false)).toBe(0); // jet raté
    expect(tauTier(NaN, true)).toBe(0); // valeur absurde
  });
  it("plafonne le nombre de tau affichés", () => {
    expect(tauShown(1)).toBe(1); // un
    expect(tauShown(4)).toBe(4); // quatre
    expect(tauShown(8)).toBe(TAU_MAX); // plafonné
  });
});
