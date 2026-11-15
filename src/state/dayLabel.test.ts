// Tests des libellés de jour.
import { describe, expect, it } from 'vitest'; // outils de test
import { dayLabel } from './dayLabel'; // fonction testée

describe('dayLabel', () => {
  const maintenant = new Date(2026, 10, 15, 22, 0).getTime(); // dimanche 15 novembre 2026, 22 h (heure locale)
  it('dit Aujourd’hui pour le même jour', () => {
    expect(dayLabel(new Date(2026, 10, 15, 8, 0).getTime(), maintenant)).toBe("Aujourd'hui"); // le matin même
  });
  it('dit Hier pour la veille', () => {
    expect(dayLabel(new Date(2026, 10, 14, 23, 59).getTime(), maintenant)).toBe('Hier'); // la veille tard
  });
  it('donne la date pour un jour plus ancien', () => {
    expect(dayLabel(new Date(2026, 10, 10, 12, 0).getTime(), maintenant)).toBe('mardi 10 novembre'); // sans année
  });
  it('ajoute l’année pour une autre année', () => {
    expect(dayLabel(new Date(2025, 11, 25, 12, 0).getTime(), maintenant)).toContain('2025'); // année affichée
  });
  it('gère le changement de mois pour Hier', () => {
    const premier = new Date(2026, 11, 1, 10, 0).getTime(); // 1er décembre
    expect(dayLabel(new Date(2026, 10, 30, 10, 0).getTime(), premier)).toBe('Hier'); // 30 novembre = hier
  });
});
