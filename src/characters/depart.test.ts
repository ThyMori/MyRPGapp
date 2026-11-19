// Tests du départ de culture et des calculs automatiques.
import { describe, expect, it } from 'vitest';
import { COMBAT_SKILLS, SKILLS } from './model';
import { emptyCharacter, sanitizeCharacter } from './sanitize';
import { DEPARTS, appliquerAuto, appliquerCombat, appliquerFavorites, appliquerJeu, appliquerRangs, derivees, estEpuise, estMelancolique, jeuActuel } from './depart';
import { rollSetup, seuilReussite } from './derive';
import { CULTURES } from './lists';

const fiche = (culture = 'Hobbits de la Comté') => { const c = emptyCharacter('t', 0); c.info.culture = culture; return c; }; // fiche de test

describe('tables du livre', () => {
  it('toutes les cultures ont un départ cohérent', () => {
    expect(Object.keys(DEPARTS).sort()).toEqual(CULTURES.map((c) => c.nom).sort()); // une entrée par culture
    for (const d of Object.values(DEPARTS)) {
      expect(d.jeux).toHaveLength(6); // un jeu par face du dé
      for (const j of d.jeux) expect(j.corps + j.coeur + j.esprit).toBe(14); // somme constante
      for (const s of SKILLS) expect(d.rangs[s.id]).toBeGreaterThanOrEqual(0); // 18 rangs présents
      for (const id of d.favorisables) expect(SKILLS.some((s) => s.id === id)).toBe(true); // favorites valides
      for (const id of d.armes) expect(COMBAT_SKILLS.some((s) => s.id === id)).toBe(true); // armes valides
    }
  });
  it('valeurs dérivées', () => {
    const c = fiche('Bardides'); c.attrs = { corps: 5, coeur: 7, esprit: 2 };
    expect(derivees(c)).toEqual({ enduranceMax: 25, espoirMax: 15, parade: 14 }); // Corps+20, Cœur+8, Esprit+12
    const n = fiche('Nains du Peuple de Durin'); n.attrs = { corps: 7, coeur: 2, esprit: 5 };
    expect(derivees(n)).toEqual({ enduranceMax: 29, espoirMax: 10, parade: 15 });
    expect(derivees(fiche('Ma culture à moi'))).toBeNull(); // culture personnalisée : rien
  });
});

describe('remplissage', () => {
  it('jeu d’attributs et reconnaissance', () => {
    const c = fiche('Elfes du Lindon');
    appliquerJeu(c, 3);
    expect(c.attrs).toEqual({ corps: 5, coeur: 3, esprit: 6 });
    expect(jeuActuel(c)).toBe(3);
    c.attrs.corps = 8; expect(jeuActuel(c)).toBe(0); // modifié à la main : libre
  });
  it('rangs, favorites et combat', () => {
    const c = fiche('Hobbits de la Comté'); c.info.vocation = 'Messager';
    appliquerRangs(c);
    expect(c.skills.discretion.rang).toBe(3);
    c.depart.favCulture = 'discretion'; c.depart.favVocation = ['chant', 'voyage'];
    appliquerFavorites(c);
    expect(['discretion', 'chant', 'voyage'].every((id) => c.skills[id].favorisee)).toBe(true);
    expect(c.skills.courtoisie.favorisee).toBe(false); // non choisie
    c.depart.favVocation = ['chant', '']; appliquerFavorites(c);
    expect(c.skills.voyage.favorisee).toBe(false); // retirée
    c.depart.armePrincipale = 'arcs'; c.depart.armeSecondaire = 'epees'; appliquerCombat(c);
    expect(c.combat).toEqual({ haches: 0, arcs: 2, lances: 0, epees: 1 });
  });
});

describe('calculs automatiques', () => {
  it('maximums, parade et états', () => {
    const c = fiche('Hobbits de la Comté'); c.attrs = { corps: 3, coeur: 6, esprit: 5 };
    appliquerAuto(c);
    expect(c.endurance).toMatchObject({ max: 21, actuelle: 21 }); // Corps 3 + 18
    expect(c.espoir).toMatchObject({ max: 16, actuelle: 16 });
    expect(c.parade.base).toBe(17);
    expect(c.etats).toMatchObject({ epuise: false, melancolique: false });
    c.endurance.actuelle = 5; c.endurance.charge = 4; c.endurance.fatigue = 1; // 5 ≤ 5
    c.espoir.actuelle = 3; c.espoir.ombre = 3; // 3 ≥ 3
    appliquerAuto(c);
    expect(c.etats).toMatchObject({ epuise: true, melancolique: true });
    c.attrs.corps = 4; appliquerAuto(c); // le maximum monte, l'actuel n'était pas plein : il reste
    expect(c.endurance).toMatchObject({ max: 22, actuelle: 5 });
  });
  it('sans effet si coupé, ou fiche vide', () => {
    const c = fiche(); c.auto = false; c.endurance.max = 7; appliquerAuto(c);
    expect(c.endurance.max).toBe(7);
    const v = emptyCharacter('v', 0); appliquerAuto(v);
    expect(v.etats).toMatchObject({ epuise: false, melancolique: false }); // pas d'état sur une fiche vierge
    expect(estEpuise(v)).toBe(false); expect(estMelancolique(v)).toBe(false);
  });
});

describe('seuil de réussite 18 / 20', () => {
  it('base de la fiche reprise par le lanceur', () => {
    expect(seuilReussite(6)).toBe(14); expect(seuilReussite(6, 18)).toBe(12);
    const c = fiche(); c.attrs.corps = 5;
    expect(rollSetup(c, 'presence')!.input.targetNumber).toBe(15);
    c.srBase = 18;
    expect(rollSetup(c, 'presence')!.input.targetNumber).toBe(13);
  });
  it('relecture : 18 gardé, valeur étrange ramenée à 20, anciennes fiches sans calcul auto', () => {
    expect(sanitizeCharacter({ id: 'a', srBase: 18 })!.srBase).toBe(18);
    expect(sanitizeCharacter({ id: 'a', srBase: 7 })!.srBase).toBe(20);
    const vieille = sanitizeCharacter({ id: 'a' })!;
    expect(vieille.auto).toBe(false); expect(vieille.verrou).toBe(false);
  });
});
