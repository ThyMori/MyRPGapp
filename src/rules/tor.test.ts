// Tests de la logique de jet de L'Anneau Unique.
import { describe, expect, it } from 'vitest'; // outils de test
import { cryptoRng, seqRng } from './rng'; // tirages
import { REGLES, evaluate, featFaceFromIndex, normalizeInput, pickFeat, rollOnce, rollRaw, type RollInput } from './tor'; // règles

// Réglages de base pour les tests, modifiables au cas par cas.
const base: RollInput = { pool: 0, mode: 'normal', weary: false, miserable: false, targetNumber: 14 };

describe('faces du dé du Destin', () => {
  it('transforme 0..11 en 1..10, Œil, Gandalf', () => {
    expect(featFaceFromIndex(0)).toBe(1); // première face
    expect(featFaceFromIndex(9)).toBe(10); // dernière face numérotée
    expect(featFaceFromIndex(10)).toBe('eye'); // Œil
    expect(featFaceFromIndex(11)).toBe('gandalf'); // rune
  });
  it('refuse un index invalide', () => {
    expect(() => featFaceFromIndex(12)).toThrow(); // trop grand
    expect(() => featFaceFromIndex(-1)).toThrow(); // négatif
  });
});

describe('dé du Destin favorisé / défavorisé', () => {
  it('favorisé garde le meilleur, l’Œil étant le pire et Gandalf le meilleur', () => {
    expect(pickFeat([3, 9], 'favoured')).toBe(1); // 9 > 3
    expect(pickFeat(['eye', 1], 'favoured')).toBe(1); // 1 > Œil
    expect(pickFeat([4, 'gandalf'], 'favoured')).toBe(1); // Gandalf gagne
  });
  it('défavorisé garde le pire', () => {
    expect(pickFeat([3, 9], 'illfavoured')).toBe(0); // 3 < 9
    expect(pickFeat([5, 'eye'], 'illfavoured')).toBe(1); // l’Œil est le pire
  });
  it('à égalité, garde le premier', () => {
    expect(pickFeat([6, 6], 'favoured')).toBe(0); // égalité
    expect(pickFeat([6, 6], 'illfavoured')).toBe(0); // égalité
  });
});

describe('rollRaw', () => {
  it('tire 1 dé du Destin en mode normal et 2 en mode favorisé', () => {
    expect(rollRaw({ ...base, pool: 2 }, seqRng([5, 0, 0])).featFaces).toHaveLength(1); // 1 d12 + 2 d6
    expect(rollRaw({ ...base, mode: 'favoured' }, seqRng([5, 6])).featFaces).toEqual([6, 7]); // 2 d12
  });
  it('tire des dés de Maîtrise entre 1 et 6', () => {
    const raw = rollRaw({ ...base, pool: 3 }, seqRng([0, 0, 5, 2])); // d12 puis trois d6
    expect(raw.successFaces).toEqual([1, 6, 3]); // 0→1, 5→6, 2→3
  });
  it('borne le nombre de dés demandé', () => {
    const raw = rollRaw({ ...base, pool: 99 }, () => 0); // tirage constant
    expect(raw.successFaces).toHaveLength(REGLES.maitriseMax); // plafonné
  });
});

describe('evaluate', () => {
  it('additionne dé du Destin et dés de Maîtrise', () => {
    const o = evaluate({ ...base, pool: 2, targetNumber: 14 }, { featFaces: [7], successFaces: [4, 3] }); // 7+4+3
    expect(o.total).toBe(14); // total exact
    expect(o.success).toBe(true); // total égal au SR : réussite
    expect(o.level).toBe('reussite'); // sans rune
  });
  it('échoue sous le SR', () => {
    const o = evaluate({ ...base, pool: 1 }, { featFaces: [3], successFaces: [4] }); // 7 < 14
    expect(o.success).toBe(false); // échec
    expect(o.level).toBe('echec'); // niveau échec
  });
  it('Épuisé : les dés de 1 à 3 comptent pour 0, la rune reste comptée', () => {
    const o = evaluate({ ...base, pool: 4, weary: true }, { featFaces: [5], successFaces: [1, 3, 4, 6] }); // 5 + 0 + 0 + 4 + 6
    expect(o.successDice.map((d) => d.value)).toEqual([0, 0, 4, 6]); // valeurs comptées
    expect(o.successDice.map((d) => d.ignored)).toEqual([true, true, false, false]); // dés ignorés
    expect(o.total).toBe(15); // total
  });
  it('sans Épuisé, les petits dés comptent', () => {
    const o = evaluate({ ...base, pool: 2 }, { featFaces: [5], successFaces: [1, 2] }); // 5+1+2
    expect(o.total).toBe(8); // rien d'ignoré
  });
  it('compte les runes : 1 = grande réussite, 2 ou plus = extraordinaire', () => {
    const grande = evaluate({ ...base, pool: 2, targetNumber: 10 }, { featFaces: [5], successFaces: [6, 2] }); // 13 avec 1 rune
    expect(grande.level).toBe('grande'); // une rune
    const extra = evaluate({ ...base, pool: 3, targetNumber: 10 }, { featFaces: [1], successFaces: [6, 6, 1] }); // 14 avec 2 runes
    expect(extra.level).toBe('extraordinaire'); // deux runes
  });
  it('les runes ne comptent pas quand le jet échoue', () => {
    const o = evaluate({ ...base, pool: 1, targetNumber: 20 }, { featFaces: [1], successFaces: [6] }); // 7 < 20
    expect(o.runes).toBe(1); // la rune est bien comptée…
    expect(o.level).toBe('echec'); // …mais le jet reste un échec
  });
  it('la rune de Gandalf réussit toujours', () => {
    const o = evaluate({ ...base, pool: 0, targetNumber: 24 }, { featFaces: ['gandalf'], successFaces: [] }); // SR impossible
    expect(o.gandalf).toBe(true); // rune retenue
    expect(o.success).toBe(true); // réussite automatique
    expect(o.level).toBe('reussite'); // niveau simple
  });
  it('l’Œil vaut 0 mais n’empêche pas de réussir si on n’est pas Mélancolique', () => {
    const o = evaluate({ ...base, pool: 3, targetNumber: 10 }, { featFaces: ['eye'], successFaces: [5, 4, 3] }); // 0+12
    expect(o.eye).toBe(true); // Œil retenu
    expect(o.featValue).toBe(0); // valeur nulle
    expect(o.success).toBe(true); // 12 ≥ 10
  });
  it('Œil + Mélancolique = échec automatique', () => {
    const o = evaluate({ ...base, pool: 6, miserable: true, targetNumber: 2 }, { featFaces: ['eye'], successFaces: [6, 6, 6, 6, 6, 6] }); // total énorme
    expect(o.autoFail).toBe(true); // échec automatique
    expect(o.success).toBe(false); // échec
  });
  it('Mélancolique sans Œil ne change rien', () => {
    const o = evaluate({ ...base, pool: 1, miserable: true, targetNumber: 5 }, { featFaces: [4], successFaces: [3] }); // 7 ≥ 5
    expect(o.success).toBe(true); // réussite normale
  });
  it('favorisé : l’Œil d’un dé est évité si l’autre dé est meilleur', () => {
    const o = evaluate({ ...base, mode: 'favoured', miserable: true }, { featFaces: ['eye', 2], successFaces: [] }); // garde le 2
    expect(o.keptIndex).toBe(1); // second dé retenu
    expect(o.eye).toBe(false); // pas d'Œil retenu
  });
});

describe('rollOnce avec le vrai tirage', () => {
  it('rend toujours des faces valides', () => {
    for (let k = 0; k < 500; k++) {
      const { raw, outcome } = rollOnce({ ...base, pool: 4, mode: 'favoured' }, cryptoRng); // 500 jets
      expect(raw.successFaces.every((f) => f >= 1 && f <= 6)).toBe(true); // d6 valides
      expect(outcome.featValue).toBeGreaterThanOrEqual(0); // valeur positive ou nulle
    }
  });
  it('est à peu près uniforme (aucune face du d12 ne manque sur 6000 tirages)', () => {
    const comptes = new Array(12).fill(0); // compteurs par face
    for (let k = 0; k < 6000; k++) comptes[cryptoRng(12)]++; // tire 6000 fois
    for (const c of comptes) {
      expect(c).toBeGreaterThan(380); // moyenne 500, marge très large
      expect(c).toBeLessThan(620); // idem
    }
  });
});

describe('normalizeInput', () => {
  it('corrige les valeurs invalides', () => {
    const n = normalizeInput({ pool: -4, mode: 'x' as never, targetNumber: 500, weary: 'oui' as never }); // entrées absurdes
    expect(n).toEqual({ pool: 0, mode: 'normal', weary: false, miserable: false, targetNumber: REGLES.srMax }); // valeurs ramenées
  });
  it('donne des valeurs par défaut', () => {
    expect(normalizeInput({})).toEqual({ pool: 3, mode: 'normal', weary: false, miserable: false, targetNumber: 14 }); // défauts
  });
});
