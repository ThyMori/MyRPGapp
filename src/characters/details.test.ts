// Tests des résumés des boutons « i » : chaque élément des listes a un détail, sans texte vide.
import { describe, expect, it } from 'vitest';
import { CULTURES, VOIES, VOCATIONS, NIVEAUX_VIE, GARANTS, RECOMPENSES_DEPART, VERTUS_COMMUNES, particularitesPour, defautsPour } from './lists';
import { detailPour, nomsDetailles } from './details';

describe('détails des listes', () => {
  it('chaque élément de chaque liste a un résumé et une page', () => {
    const attendus: [Parameters<typeof detailPour>[0], string[]][] = [
      ['culture', CULTURES.map((c) => c.nom)],
      ['avantage', CULTURES.map((c) => c.avantage)],
      ['vocation', VOCATIONS.map((v) => v.nom)],
      ['voie', VOIES.map((v) => v.nom)],
      ['niveauVie', NIVEAUX_VIE],
      ['garant', GARANTS],
      ['recompense', RECOMPENSES_DEPART],
      ['vertu', [...VERTUS_COMMUNES, ...CULTURES.flatMap((c) => c.vertus)]],
      ['particularite', [...particularitesPour(''), ...VOCATIONS.map((v) => v.particularite)]],
      ['defaut', defautsPour('')],
    ];
    for (const [cat, noms] of attendus) {
      for (const nom of noms) {
        const d = detailPour(cat, nom);
        expect(d, `${cat} : ${nom}`).not.toBeNull(); // détail présent
        expect(d!.resume.length).toBeGreaterThan(10); // texte non vide
        expect(d!.page).toBeGreaterThan(0); // page connue
      }
    }
  });
  it('aucun détail orphelin (nom absent des listes)', () => {
    expect(nomsDetailles('vertu').length).toBe(VERTUS_COMMUNES.length + CULTURES.length * 6); // 42 vertus
    expect(nomsDetailles('particularite').length).toBe(30); // 24 + 6
    expect(nomsDetailles('defaut').length).toBe(24); // 4 par voie
  });
  it('une saisie libre ou vide n’a pas de détail', () => {
    expect(detailPour('vertu', 'Ma vertu à moi')).toBeNull();
    expect(detailPour('vertu', '')).toBeNull();
  });
});
