// Tests des réglages mémorisés.
import { describe, expect, it } from 'vitest'; // outils de test
import { HISTORY_MAX, pickScreen, sanitizeHistory, sanitizeRollInput } from './settings'; // fonctions testées

describe('pickScreen', () => {
  it('rouvre l’écran mémorisé s’il existe', () => {
    expect(pickScreen('oracles')).toBe('oracles'); // écran valide
  });
  it('replie sur le lanceur si la cible n’existe plus ou est absente', () => {
    expect(pickScreen('ancien-ecran')).toBe('roller'); // écran supprimé
    expect(pickScreen(null)).toBe('roller'); // rien de mémorisé
    expect(pickScreen(42)).toBe('roller'); // valeur absurde
  });
});

describe('sanitizeRollInput', () => {
  it('rend des réglages valides même pour une valeur abîmée', () => {
    expect(sanitizeRollInput('n’importe quoi').pool).toBe(3); // texte : défauts
    expect(sanitizeRollInput({ pool: 5, targetNumber: 16 }).pool).toBe(5); // valeur correcte conservée
  });
});

describe('sanitizeHistory', () => {
  // Entrée minimale valide.
  const ok = { id: 'a', ts: 1, input: { pool: 1 }, outcome: { total: 10, level: 'reussite' } };
  it('rejette ce qui n’est pas une liste', () => {
    expect(sanitizeHistory({})).toEqual([]); // objet
    expect(sanitizeHistory(null)).toEqual([]); // absent
  });
  it('retire les entrées abîmées', () => {
    expect(sanitizeHistory([ok, null, { id: 3 }, 'x'])).toHaveLength(1); // une seule bonne entrée
  });
  it('plafonne la taille', () => {
    const beaucoup = Array.from({ length: HISTORY_MAX + 20 }, (_, i) => ({ ...ok, id: String(i) })); // trop d'entrées
    expect(sanitizeHistory(beaucoup)).toHaveLength(HISTORY_MAX); // coupé
  });
});
