// Tests de la répartition des dés sur l'écran.
import { describe, expect, it } from 'vitest'; // outils de test
import { DIE_RADIUS, scatterDice, type DieKind, type Random } from './layout'; // fonction testée

// Petit générateur pseudo-aléatoire reproductible (mulberry32), pour des tests qui donnent toujours le même résultat.
function graine(a: number): Random {
  return () => {
    a |= 0; // reste un entier 32 bits
    a = (a + 0x6d2b79f5) | 0; // avance l'état
    let t = Math.imul(a ^ (a >>> 15), 1 | a); // mélange
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; // mélange encore
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // ramène dans [0, 1[
  };
}

// Dix dés : deux dés du Destin et huit dés de Maîtrise (le maximum de l'app).
const DIX: DieKind[] = ['feat', 'feat', ...Array<DieKind>(8).fill('success')];

describe('scatterDice', () => {
  it('rend une position par dé', () => {
    expect(scatterDice(DIX, 3.5, 7, graine(1))).toHaveLength(10); // une position par dé
    expect(scatterDice([], 3.5, 7, graine(1))).toEqual([]); // aucun dé, aucune position
  });
  it('garde chaque dé entièrement dans le cadre (portrait et paysage)', () => {
    for (const [w, h] of [[3.05, 6.75], [6.75, 3.05]]) {
      for (let s = 1; s <= 20; s++) {
        const ps = scatterDice(DIX, w, h, graine(s)); // une répartition
        DIX.forEach((k, i) => {
          expect(Math.abs(ps[i].x) + DIE_RADIUS[k]).toBeLessThanOrEqual(w + 1e-9); // dans la largeur
          expect(Math.abs(ps[i].z) + DIE_RADIUS[k]).toBeLessThanOrEqual(h + 1e-9); // dans la hauteur
        });
      }
    }
  });
  it("ne fait jamais se chevaucher deux dés quand la place suffit", () => {
    for (const [w, h] of [[3.05, 6.75], [3.05, 5.75], [6.75, 3.05], [7.15, 4.85]]) {
      for (let s = 1; s <= 30; s++) {
        const ps = scatterDice(DIX, w, h, graine(s)); // une répartition
        for (let i = 0; i < ps.length; i++) {
          for (let j = i + 1; j < ps.length; j++) {
            const d = Math.hypot(ps[i].x - ps[j].x, ps[i].z - ps[j].z); // distance entre les centres
            expect(d).toBeGreaterThanOrEqual(DIE_RADIUS[DIX[i]] + DIE_RADIUS[DIX[j]]); // les dés ne se touchent pas
          }
        }
      }
    }
  });
  it('met un dé seul dans le cadre et gère un cadre minuscule', () => {
    const [p] = scatterDice(['feat'], 4, 4, graine(3)); // un dé
    expect(Math.abs(p.x)).toBeLessThanOrEqual(4 - DIE_RADIUS.feat); // dans le cadre
    for (const p of scatterDice(['feat', 'success'], 0.2, 0.2, graine(3))) {
      expect(Math.abs(p.x)).toBe(0); // cadre trop petit : tout au centre, sans planter
      expect(Math.abs(p.z)).toBe(0);
    }
  });
});
