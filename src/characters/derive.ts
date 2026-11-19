// Valeurs calculées à partir d'une fiche, et réglages du lanceur de dés. Logique pure.
// Seuil de réussite = 20 − valeur de l'attribut (campagne), ou 18 − valeur pour un scénario court (livre, p.18).
import { COMBAT_SKILLS, SKILLS, type AttrId, type Character } from './model'; // modèle
import { normalizeInput, type RollInput } from '../rules/tor'; // réglages de jet

export const SR_BASE = 20; // base par défaut

// Seuil de réussite d'un attribut (base 20, ou 18 en scénario court).
export function seuilReussite(valeur: number, base: number = SR_BASE): number {
  return base - valeur; // plus la valeur est haute, plus le seuil est bas
}

// Total de la parade (base + bouclier + autre).
export function totalParade(c: Character): number {
  return c.parade.base + c.parade.bouclier + c.parade.autre; // somme
}

// Total de la protection (armure + casque + autre).
export function totalProtection(c: Character): number {
  return c.protection.armure + c.protection.casque + c.protection.autre; // somme
}

// Résultat de la préparation d'un jet depuis la fiche.
export interface RollSetup {
  label: string; // nom de la compétence
  input: RollInput; // réglages du lanceur
}

// Prépare un jet pour une compétence (générale ou de combat) ; rend null si elle n'existe pas.
export function rollSetup(c: Character, skillId: string): RollSetup | null {
  const gen = SKILLS.find((s) => s.id === skillId); // compétence générale ?
  const cmb = COMBAT_SKILLS.find((s) => s.id === skillId); // compétence de combat ?
  if (!gen && !cmb) return null; // inconnue
  const attr: AttrId = gen ? gen.attr : 'corps'; // les compétences de combat dépendent du Corps
  const rang = gen ? c.skills[skillId]?.rang ?? 0 : c.combat[skillId] ?? 0; // nombre de dés de Maîtrise
  const favorisee = gen ? c.skills[skillId]?.favorisee === true : false; // dé du Destin favorisé
  return {
    label: (gen ?? cmb)!.label,
    input: normalizeInput({
      pool: rang,
      mode: favorisee ? 'favoured' : 'normal',
      weary: c.etats.epuise,
      miserable: c.etats.melancolique,
      targetNumber: seuilReussite(c.attrs[attr], c.srBase),
    }),
  };
}
