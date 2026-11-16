// Tests du calendrier de l'annonce Réussite / Échec.
import { describe, expect, it } from 'vitest'; // outils de test
import { sanitizeVerdict } from '../state/prefs'; // réglage
import { planVerdict } from './verdictPlan'; // fonction testée

describe('planVerdict', () => {
  it("sans scène, l'annonce vient quand les dés s'effacent", () => {
    expect(planVerdict(0, 3000)).toEqual({ holdMs: 3000, pauseMs: 3000 }); // attend la fin du maintien
  });
  it("avec une scène courte, l'annonce attend le reste du maintien", () => {
    expect(planVerdict(2800, 3000)).toEqual({ holdMs: 3000, pauseMs: 200 }); // 200 ms de plus
  });
  it("avec des scènes longues, les dés restent jusqu'à la fin des scènes", () => {
    expect(planVerdict(6600, 3000)).toEqual({ holdMs: 6600, pauseMs: 0 }); // annonce juste après
  });
  it('ignore les valeurs négatives', () => {
    expect(planVerdict(-5, -1)).toEqual({ holdMs: 0, pauseMs: 0 }); // rien
  });
});

describe('sanitizeVerdict', () => {
  it('est activé par défaut, coupé seulement si false', () => {
    expect(sanitizeVerdict(undefined)).toBe(true); // défaut
    expect(sanitizeVerdict(false)).toBe(false); // coupé
    expect(sanitizeVerdict('non')).toBe(true); // valeur absurde
  });
});
