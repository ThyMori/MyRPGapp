// Tests des préférences.
import { describe, expect, it } from 'vitest'; // outils de test
import { otherStyle, sanitizeDiceStyle, sanitizeSound } from './prefs'; // fonctions testées

describe('préférences', () => {
  it('couleur des dés : noir sauf si « white »', () => {
    expect(sanitizeDiceStyle('white')).toBe('white'); // blanc reconnu
    expect(sanitizeDiceStyle('black')).toBe('black'); // noir reconnu
    for (const v of [undefined, null, 3, 'rouge', {}]) expect(sanitizeDiceStyle(v)).toBe('black'); // le reste donne noir
  });
  it('son : activé sauf si exactement false', () => {
    expect(sanitizeSound(false)).toBe(false); // coupé
    for (const v of [true, undefined, null, 0, 'non']) expect(sanitizeSound(v)).toBe(true); // le reste garde le son
  });
  it('bascule la couleur', () => {
    expect(otherStyle('black')).toBe('white'); // noir → blanc
    expect(otherStyle('white')).toBe('black'); // blanc → noir
  });
});
