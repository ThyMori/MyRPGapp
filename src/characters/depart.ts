// Création et calculs automatiques de la fiche, d'après les tableaux de culture et de vocation du livre de base. Logique pure.
// Il s'agit de nombres (rangs, jeux d'attributs, bases de calcul), pas de texte de règle.
import { COMBAT_SKILLS, SKILLS, type AttrId, type Character } from './model'; // modèle
import { findVocation } from './lists'; // vocations

// Un jeu d'attributs proposé par une culture (le dé de Maîtrise donne le numéro 1 à 6).
export type JeuAttributs = Record<AttrId, number>;

// Ce que le livre fixe pour une culture.
export interface DepartCulture {
  jeux: JeuAttributs[]; // 6 jeux d'attributs (index 0 = résultat 1 du dé)
  baseEndurance: number; // Endurance maximale = Corps + base
  baseEspoir: number; // Espoir maximal = Cœur + base
  baseParade: number; // Parade de base = Esprit + base
  rangs: Record<string, number>; // rang de départ de chaque compétence commune
  favorisables: [string, string]; // une des deux devient favorite
  armes: [string, string]; // une des deux armes passe au rang 2
}

// Raccourci d'écriture d'un jeu : corps, cœur, esprit.
const j = (corps: number, coeur: number, esprit: number): JeuAttributs => ({ corps, coeur, esprit });

// Raccourci des 18 rangs dans l'ordre de la fiche (SKILLS) : présence, athlétisme, vigilance, chasse, chant, artisanat, inspiration, voyage, intuition, soins, courtoisie, art de la guerre, persuasion, discrétion, inspection, exploration, énigmes, connaissances.
const rangs = (...n: number[]): Record<string, number> => Object.fromEntries(SKILLS.map((s, i) => [s.id, n[i]]));

export const DEPARTS: Record<string, DepartCulture> = {
  'Bardides': { jeux: [j(5, 7, 2), j(4, 7, 3), j(5, 6, 3), j(4, 6, 4), j(5, 5, 4), j(6, 6, 2)], baseEndurance: 20, baseEspoir: 8, baseParade: 12, rangs: rangs(1, 1, 0, 2, 1, 1, 2, 1, 2, 0, 2, 2, 3, 0, 1, 1, 0, 1), favorisables: ['inspiration', 'athletisme'], armes: ['arcs', 'epees'] },
  'Elfes du Lindon': { jeux: [j(5, 2, 7), j(4, 3, 7), j(5, 3, 6), j(4, 4, 6), j(5, 4, 5), j(6, 2, 6)], baseEndurance: 20, baseEspoir: 8, baseParade: 12, rangs: rangs(2, 2, 2, 0, 2, 2, 1, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 3), favorisables: ['chant', 'connaissances'], armes: ['arcs', 'lances'] },
  'Hobbits de la Comté': { jeux: [j(3, 6, 5), j(3, 7, 4), j(2, 7, 5), j(4, 6, 4), j(4, 5, 5), j(2, 6, 6)], baseEndurance: 18, baseEspoir: 10, baseParade: 12, rangs: rangs(0, 0, 2, 0, 2, 1, 0, 0, 2, 1, 2, 0, 2, 3, 0, 0, 3, 0), favorisables: ['discretion', 'courtoisie'], armes: ['arcs', 'epees'] },
  'Hommes de Bree': { jeux: [j(2, 5, 7), j(3, 4, 7), j(3, 5, 6), j(4, 4, 6), j(4, 5, 5), j(2, 6, 6)], baseEndurance: 20, baseEspoir: 10, baseParade: 10, rangs: rangs(0, 1, 1, 1, 1, 2, 2, 1, 2, 0, 3, 0, 2, 1, 1, 1, 2, 0), favorisables: ['intuition', 'enigmes'], armes: ['haches', 'lances'] },
  'Nains du Peuple de Durin': { jeux: [j(7, 2, 5), j(7, 3, 4), j(6, 3, 5), j(6, 4, 4), j(5, 4, 5), j(6, 2, 6)], baseEndurance: 22, baseEspoir: 8, baseParade: 10, rangs: rangs(2, 1, 0, 0, 1, 2, 0, 3, 0, 0, 1, 1, 0, 0, 3, 2, 2, 1), favorisables: ['voyage', 'artisanat'], armes: ['haches', 'epees'] },
  'Rôdeurs du Nord': { jeux: [j(7, 5, 2), j(7, 4, 3), j(6, 5, 3), j(6, 4, 4), j(5, 5, 4), j(6, 6, 2)], baseEndurance: 20, baseEspoir: 6, baseParade: 14, rangs: rangs(1, 2, 2, 2, 0, 0, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 2), favorisables: ['chasse', 'connaissances'], armes: ['lances', 'epees'] },
};

// Les trois compétences proposées par chaque vocation (on en choisit deux comme favorites).
export const COMPETENCES_VOCATION: Record<string, [string, string, string]> = {
  'Capitaine': ['artguerre', 'inspiration', 'persuasion'],
  'Champion': ['athletisme', 'chasse', 'presence'],
  'Chasseur de trésors': ['discretion', 'exploration', 'inspection'],
  'Érudit': ['artisanat', 'connaissances', 'enigmes'],
  'Messager': ['chant', 'courtoisie', 'voyage'],
  'Protecteur': ['intuition', 'soins', 'vigilance'],
};

// Trésor de départ de chaque niveau de vie (ceux qui n'en ont pas sont absents).
export const TRESOR_DEPART: Record<string, number> = { 'Modeste': 0, 'Courant': 30, 'Prospère': 90, 'Riche': 180 };

// Départ de la culture d'une fiche (undefined si la culture est vide ou personnelle).
export function departDe(c: Character): DepartCulture | undefined {
  return DEPARTS[c.info.culture]; // table de la culture
}

// Le jeu d'attributs de la fiche correspond-il à un jeu du livre ? Rend 1 à 6, ou 0 (libre).
export function jeuActuel(c: Character): number {
  const d = departDe(c); // culture
  if (!d) return 0; // pas de culture : libre
  const i = d.jeux.findIndex((x) => x.corps === c.attrs.corps && x.coeur === c.attrs.coeur && x.esprit === c.attrs.esprit); // jeu identique ?
  return i + 1; // 0 si aucun
}

// Applique le jeu d'attributs n (1 à 6) de la culture ; 0 ne change rien (réglage libre).
export function appliquerJeu(c: Character, n: number): void {
  const d = departDe(c); // culture
  const jeu = d?.jeux[n - 1]; // jeu demandé
  if (!jeu) return; // libre ou culture inconnue
  c.attrs = { ...jeu }; // copie
}

// Applique les rangs de départ de la culture aux 18 compétences communes.
export function appliquerRangs(c: Character): void {
  const d = departDe(c); // culture
  if (!d) return; // rien à faire
  for (const s of SKILLS) c.skills[s.id].rang = d.rangs[s.id] ?? 0; // rang du livre
}

// Recalcule les compétences favorites choisies : celles que proposent la culture et la vocation suivent les choix, les autres ne bougent pas.
export function appliquerFavorites(c: Character): void {
  const d = departDe(c); // culture
  const voc = COMPETENCES_VOCATION[c.info.vocation] ?? []; // trois compétences de la vocation
  const candidates = new Set<string>([...(d?.favorisables ?? []), ...voc]); // celles qui dépendent des choix
  const choisies = new Set<string>([c.depart.favCulture, ...c.depart.favVocation].filter(Boolean)); // choix faits
  for (const id of candidates) if (c.skills[id]) c.skills[id].favorisee = choisies.has(id); // coche selon les choix
}

// Applique les rangs de combat : arme principale 2, seconde arme 1, les autres 0 (rien si aucun choix).
export function appliquerCombat(c: Character): void {
  const { armePrincipale, armeSecondaire } = c.depart; // choix
  if (!armePrincipale && !armeSecondaire) return; // rien choisi : on ne touche à rien
  for (const s of COMBAT_SKILLS) c.combat[s.id] = s.id === armePrincipale ? 2 : s.id === armeSecondaire ? 1 : 0; // rangs
}

// Valeurs calculées d'après la culture et les attributs (null si la culture n'est pas du livre).
export interface Derivees {
  enduranceMax: number;
  espoirMax: number;
  parade: number;
}
export function derivees(c: Character): Derivees | null {
  const d = departDe(c); // culture
  if (!d) return null; // personnalisée : rien à calculer
  return { enduranceMax: c.attrs.corps + d.baseEndurance, espoirMax: c.attrs.coeur + d.baseEspoir, parade: c.attrs.esprit + d.baseParade };
}

// Épuisé : l'Endurance actuelle ne dépasse plus la charge portée (fatigue comprise). Rien tant que l'Endurance maximale n'est pas réglée.
export function estEpuise(c: Character): boolean {
  return c.endurance.max > 0 && c.endurance.actuelle <= c.endurance.charge + c.endurance.fatigue; // comparaison du livre
}

// Mélancolique : l'Ombre égale ou dépasse l'Espoir actuel. Rien tant que l'Espoir maximal n'est pas réglé.
export function estMelancolique(c: Character): boolean {
  return c.espoir.max > 0 && c.espoir.ombre >= c.espoir.actuelle; // comparaison du livre
}

// Applique tous les calculs automatiques (sans effet si le mode automatique est coupé).
// Quand un maximum change, la valeur actuelle suit si elle était au maximum (ou à zéro) ; elle ne dépasse jamais le maximum.
export function appliquerAuto(c: Character): void {
  if (!c.auto) return; // l'utilisateur règle tout lui-même
  const v = derivees(c); // valeurs du livre
  if (v) {
    const suit = (o: { max: number; actuelle: number }, nouveau: number) => {
      const etaitPlein = o.max === 0 || o.actuelle === o.max; // la valeur actuelle suivait le maximum
      o.max = nouveau; // nouveau maximum
      if (etaitPlein || o.actuelle > nouveau) o.actuelle = nouveau; // suit ou plafonne
    };
    suit(c.endurance, v.enduranceMax); // endurance
    suit(c.espoir, v.espoirMax); // espoir
    c.parade.base = v.parade; // parade de base
  }
  c.etats.epuise = estEpuise(c); // état déduit
  c.etats.melancolique = estMelancolique(c); // état déduit
}

// Applique d'un coup les valeurs de départ liées au niveau de vie : trésor de départ (rien si le niveau est inconnu).
export function tresorDeDepart(niveau: string): number | null {
  return niveau in TRESOR_DEPART ? TRESOR_DEPART[niveau] : null; // valeur ou null
}

// Pour l'affichage : libellé d'un jeu d'attributs.
export function libelleJeu(jeu: JeuAttributs, n: number): string {
  return `${n} : Corps ${jeu.corps} · Cœur ${jeu.coeur} · Esprit ${jeu.esprit}`; // « 1 : Corps 5 · Cœur 7 · Esprit 2 »
}

// Une vocation connue a-t-elle des compétences à choisir ?
export function competencesVocation(vocation: string): [string, string, string] | null {
  return findVocation(vocation) ? COMPETENCES_VOCATION[vocation] ?? null : null; // trois choix ou null
}
