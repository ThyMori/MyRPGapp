// Tests des réglages de qualité.
import { describe, expect, it } from 'vitest'; // outils de test
import { lower, nextFx, sanitizeFx, startQuality } from './quality'; // fonctions testées

describe('réglage des effets', () => {
  it('remet en ordre les valeurs inconnues', () => {
    expect(sanitizeFx(undefined)).toBe('high'); // défaut
    expect(sanitizeFx('n’importe quoi')).toBe('high'); // valeur absurde
    expect(sanitizeFx('low')).toBe('low'); // valeur valide
    expect(sanitizeFx('off')).toBe('off'); // valeur valide
  });
  it('fait défiler élevé → réduit → simple → élevé', () => {
    expect(nextFx('high')).toBe('low'); // premier clic
    expect(nextFx('low')).toBe('off'); // deuxième clic
    expect(nextFx('off')).toBe('high'); // retour au début
  });
});

describe('qualité de rendu', () => {
  it('borne la résolution des écrans très denses', () => {
    expect(startQuality('high', 3).scale).toBe(1.5); // plafonné
    expect(startQuality('high', 1).scale).toBe(1); // écran normal
    expect(startQuality('low', 2).scale).toBeLessThan(1); // réduit : moins de pixels
  });
  it("baisse seulement quand l'appareil rame, et pas en dessous du plancher", () => {
    const q = startQuality('high', 2);
    expect(lower(q, 16)).toBeNull(); // fluide : rien à faire
    const bas = lower(q, 50); // lent
    expect(bas).not.toBeNull(); // on baisse
    expect(bas!.scale).toBeLessThan(q.scale); // moins de pixels
    expect(bas!.oct).toBe(3); // moins de couches
    let cur = bas;
    for (let i = 0; i < 10 && cur; i++) cur = lower(cur, 50); // on baisse encore et encore
    expect(cur).toBeNull(); // un plancher existe
  });
});
