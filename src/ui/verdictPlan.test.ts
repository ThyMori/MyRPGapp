// Tests du calendrier des scènes et du réglage de l'annonce.
import { describe, expect, it } from 'vitest'; // outils de test
import { sanitizeVerdict } from '../state/prefs'; // réglage
import { planHold } from './verdictPlan'; // fonction testée

describe('planHold', () => {
  it("garde la durée normale quand les scènes sont plus courtes", () => {
    expect(planHold(2400, 3000)).toBe(3000); // l'annonce seule tient dans le maintien normal
  });
  it("prolonge les dés jusqu'à la fin des scènes quand elles sont plus longues", () => {
    expect(planHold(2400 + 2800 + 3800, 3000)).toBe(9000); // annonce + présage + fête des tau
  });
  it('ignore les valeurs négatives', () => {
    expect(planHold(-5, -1)).toBe(0); // rien
  });
});

describe('sanitizeVerdict', () => {
  it('est activé par défaut, coupé seulement si false', () => {
    expect(sanitizeVerdict(undefined)).toBe(true); // défaut
    expect(sanitizeVerdict(false)).toBe(false); // coupé
    expect(sanitizeVerdict('non')).toBe(true); // valeur absurde
  });
});
