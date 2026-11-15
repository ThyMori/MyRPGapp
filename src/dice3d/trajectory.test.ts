// Tests des trajectoires de dés.
import { describe, expect, it } from 'vitest'; // outils de test
import type { Random } from './layout'; // type du hasard
import { easeOut, easeOutInverse, flightPosition, fold, impactEvents, planFlight, type Walls } from './trajectory'; // fonctions testées

const MURS: Walls = { x: 2.6, top: 6.3 }; // murs d'un écran de téléphone en portrait

// Hasard reproductible.
function graine(a: number): Random {
  return () => {
    a |= 0; // entier 32 bits
    a = (a + 0x6d2b79f5) | 0; // avance l'état
    let t = Math.imul(a ^ (a >>> 15), 1 | a); // mélange
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; // mélange encore
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // dans [0, 1[
  };
}

describe('easeOut', () => {
  it('va de 0 à 1 en ralentissant, et son inverse le retrouve', () => {
    expect(easeOut(0)).toBe(0); // départ
    expect(easeOut(1)).toBe(1); // arrivée
    expect(easeOut(0.5)).toBeGreaterThan(0.5); // rapide au début
    for (const t of [0, 0.1, 0.4, 0.8, 1]) expect(easeOutInverse(easeOut(t))).toBeCloseTo(t, 6); // aller-retour exact
  });
});

describe('fold', () => {
  it('renvoie vers l’intérieur ce qui dépasse un mur', () => {
    expect(fold(3, -2, 2)).toBe(1); // dépasse à droite
    expect(fold(-3, -2, 2)).toBe(-1); // dépasse à gauche
    expect(fold(1, -2, 2)).toBe(1); // à l'intérieur
    expect(fold(-9, -2, Infinity)).toBe(5); // mur du haut seul
  });
});

describe('planFlight / flightPosition', () => {
  const reste = { x: 1.2, z: -3.4 }; // une place finale
  it('part sous l’écran et arrive exactement sur la place finale', () => {
    for (let s = 1; s <= 50; s++) {
      const f = planFlight(reste, MURS, 9, graine(s)); // un vol
      expect(f.start.z).toBe(9); // part du bas
      const debut = flightPosition(f, 0, MURS); // position au départ
      expect(debut.x).toBeCloseTo(f.start.x, 9); // au point de départ
      const fin = flightPosition(f, 1, MURS); // position à l'arrivée
      expect(fin.x).toBeCloseTo(reste.x, 9); // à la bonne abscisse
      expect(fin.z).toBeCloseTo(reste.z, 9); // à la bonne profondeur
    }
  });
  it('ne sort jamais des murs en route (gauche, droite, haut)', () => {
    for (let s = 1; s <= 50; s++) {
      const f = planFlight({ x: (graine(s * 7)() * 2 - 1) * MURS.x, z: (graine(s * 11)() * 2 - 1) * MURS.top }, MURS, 9, graine(s)); // vol vers une place au hasard
      for (let k = 0; k <= 100; k++) {
        const p = flightPosition(f, k / 100, MURS); // position à ce moment
        expect(Math.abs(p.x)).toBeLessThanOrEqual(MURS.x + 1e-9); // entre les murs latéraux
        expect(p.z).toBeGreaterThanOrEqual(-MURS.top - 1e-9); // sous le mur du haut
      }
    }
  });
});

describe('impactEvents', () => {
  it('liste des chocs triés, entre 0 et 1, avec une force entre 0 et 1', () => {
    for (let s = 1; s <= 50; s++) {
      const f = planFlight({ x: 0.5, z: 2 }, MURS, 9, graine(s)); // un vol
      const ev = impactEvents(f, MURS); // ses chocs
      expect(ev.length).toBeGreaterThanOrEqual(3); // au moins : 2 rebonds + la pose
      for (let i = 0; i < ev.length; i++) {
        expect(ev[i].t).toBeGreaterThan(0); // après le départ
        expect(ev[i].t).toBeLessThanOrEqual(1); // avant ou à l'arrivée
        expect(ev[i].strength).toBeGreaterThan(0); // audible
        expect(ev[i].strength).toBeLessThanOrEqual(1); // jamais plus fort que 1
        if (i > 0) expect(ev[i].t).toBeGreaterThanOrEqual(ev[i - 1].t); // triés
      }
      expect(ev[ev.length - 1].t).toBe(1); // le dernier choc est la pose
    }
  });
  it('compte un choc de mur quand la cible est repliée derrière un mur, et le place à l’instant où le dé le touche', () => {
    const f = { start: { x: 0, z: 9 }, virtual: { x: 0, z: -2 * MURS.top - 1 }, rest: { x: 0, z: 1 } }; // vol replié sur le mur du haut
    const murs = impactEvents(f, MURS).filter((e) => e.kind === 'wall'); // chocs de mur
    expect(murs).toHaveLength(1); // un seul
    const p = flightPosition(f, easeOut(murs[0].t), MURS); // où est le dé à cet instant ?
    expect(p.z).toBeCloseTo(-MURS.top, 6); // contre le mur du haut
  });
  it('n’ajoute aucun choc de mur quand le vol ne rebondit pas', () => {
    const f = { start: { x: 0, z: 9 }, virtual: { x: 1, z: 2 }, rest: { x: 1, z: 2 } }; // vol direct
    expect(impactEvents(f, MURS).filter((e) => e.kind === 'wall')).toHaveLength(0); // aucun mur touché
  });
});
