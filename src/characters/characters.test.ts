// Tests de la fiche de personnage : remise en ordre, calculs, préparation d'un jet.
import { describe, expect, it } from 'vitest';
import { rollSetup, seuilReussite, totalParade, totalProtection } from './derive';
import { SKILLS } from './model';
import { emptyCharacter, entier, sanitizeCharacter, sanitizeCharacters } from './sanitize';

describe('sanitize', () => {
  it('rejette ce qui n\'a pas d\'identifiant', () => {
    expect(sanitizeCharacter(null)).toBeNull();
    expect(sanitizeCharacter({ nom: 'x' })).toBeNull();
    expect(sanitizeCharacter('texte')).toBeNull();
  });
  it('complète une fiche partielle avec des valeurs sûres', () => {
    const c = sanitizeCharacter({ id: 'a', nom: 'Frodo' })!;
    expect(c.nom).toBe('Frodo');
    expect(c.attrs.corps).toBe(4);
    expect(Object.keys(c.skills)).toHaveLength(SKILLS.length);
    expect(c.armes).toHaveLength(4);
    expect(c.armures).toHaveLength(3);
  });
  it('ramène les valeurs dans leurs bornes', () => {
    const c = sanitizeCharacter({ id: 'a', attrs: { corps: 99, coeur: -5, esprit: 'x' }, skills: { athletisme: { rang: 42, favorisee: 'oui' } }, endurance: { max: -3 } })!;
    expect(c.attrs).toEqual({ corps: 8, coeur: 2, esprit: 4 });
    expect(c.skills.athletisme).toEqual({ rang: 6, favorisee: false });
    expect(c.endurance.max).toBe(0);
  });
  it('coupe les textes trop longs et ignore les types faux', () => {
    const c = sanitizeCharacter({ id: 'a', nom: 'x'.repeat(500), histoire: 12, info: { culture: ['a'] } })!;
    expect(c.nom).toHaveLength(80);
    expect(c.histoire).toBe('');
    expect(c.info.culture).toBe('');
  });
  it('relit une fiche déjà propre sans la changer', () => {
    const c = emptyCharacter('z', 5);
    c.nom = 'Aria';
    c.skills.chasse.rang = 3;
    expect(sanitizeCharacter(JSON.parse(JSON.stringify(c)))).toEqual(c);
  });
  it('liste : ignore les entrées abîmées et les doublons', () => {
    const l = sanitizeCharacters([{ id: 'a' }, null, { id: 'a', nom: 'bis' }, { id: 'b' }, 7]);
    expect(l.map((c) => c.id)).toEqual(['a', 'b']);
    expect(sanitizeCharacters('nimporte quoi')).toEqual([]);
  });
  it('entier : arrondit et borne', () => {
    expect(entier(2.6, 0, 5, 1)).toBe(3);
    expect(entier(NaN, 0, 5, 1)).toBe(1);
    expect(entier(9, 0, 5, 1)).toBe(5);
  });
});

describe('derive', () => {
  it('seuil de réussite = 20 − valeur', () => {
    expect(seuilReussite(2)).toBe(18);
    expect(seuilReussite(8)).toBe(12);
  });
  it('totaux de parade et de protection', () => {
    const c = emptyCharacter('a', 0);
    c.parade = { base: 2, bouclier: 1, autre: 0 };
    c.protection = { armure: 3, casque: 1, autre: 1 };
    expect(totalParade(c)).toBe(3);
    expect(totalProtection(c)).toBe(5);
  });
  it('prépare un jet : rang, état, favorisée, SR de l\'attribut', () => {
    const c = emptyCharacter('a', 0);
    c.attrs.corps = 6;
    c.skills.athletisme = { rang: 4, favorisee: true };
    c.etats.epuise = true;
    const s = rollSetup(c, 'athletisme')!;
    expect(s.label).toBe('Athlétisme');
    expect(s.input).toEqual({ pool: 4, mode: 'favoured', weary: true, miserable: false, targetNumber: 14 });
  });
  it('les compétences de combat utilisent le Corps', () => {
    const c = emptyCharacter('a', 0);
    c.attrs.corps = 7;
    c.attrs.coeur = 3;
    c.combat.epees = 2;
    expect(rollSetup(c, 'epees')!.input).toMatchObject({ pool: 2, targetNumber: 13, mode: 'normal' });
  });
  it('compétence inconnue : null', () => {
    expect(rollSetup(emptyCharacter('a', 0), 'nimporte')).toBeNull();
  });
});

describe('listes du livre', () => {
  it('chaque culture a 8 particularités et 6 vertus, sans doublon', async () => {
    const { CULTURES } = await import('./lists');
    expect(CULTURES).toHaveLength(6);
    for (const c of CULTURES) {
      expect(c.particularites).toHaveLength(8);
      expect(new Set(c.particularites).size).toBe(8);
      expect(c.vertus).toHaveLength(6);
    }
  });
  it('vocations : six, avec une voie de l\'Ombre existante', async () => {
    const { VOCATIONS, VOIES } = await import('./lists');
    expect(VOCATIONS).toHaveLength(6);
    for (const v of VOCATIONS) expect(VOIES.some((x) => x.nom === v.voie)).toBe(true);
    expect(new Set(VOCATIONS.map((v) => v.voie)).size).toBe(6);
  });
  it('niveau de vie de chaque culture est dans la liste des six niveaux', async () => {
    const { CULTURES, NIVEAUX_VIE } = await import('./lists');
    for (const c of CULTURES) expect(NIVEAUX_VIE).toContain(c.niveauVie);
  });
  it('réglages liés : culture → avantage + niveau de vie ; vocation → voie + particularité', async () => {
    const { reglagesCulture, reglagesVocation } = await import('./lists');
    expect(reglagesCulture('Hobbits de la Comté')).toEqual({ avantage: 'Bon sens hobbit', niveauVie: 'Courant' });
    expect(reglagesVocation('Érudit')).toEqual({ voie: 'Attrait des secrets', particularite: 'Rimes de savoir' });
    expect(reglagesCulture('')).toBeNull();
    expect(reglagesVocation('Inconnue')).toBeNull();
  });
  it('particularités et défauts proposés : ceux de la culture / voie, sinon tous', async () => {
    const { particularitesPour, defautsPour } = await import('./lists');
    expect(particularitesPour('Rôdeurs du Nord')).toContain('Sincère');
    expect(particularitesPour('').length).toBeGreaterThan(8);
    expect(defautsPour('Malédiction de vengeance')).toEqual(['Brutal', 'Rancunier']);
    expect(defautsPour('').length).toBeGreaterThan(10);
  });
  it('ancien texte libre de particularités / défauts repris dans la première case', () => {
    const c = sanitizeCharacter({ id: 'a', info: { particularites: 'Têtu comme une mule', defauts: 'Rancunier' } })!;
    expect(c.particularites).toEqual(['Têtu comme une mule', '', '']);
    expect(c.defauts).toEqual(['Rancunier', '']);
  });
});
