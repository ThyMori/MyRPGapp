// Fiche de personnage : types et listes fixes. Logique pure, sans DOM ni stockage.
// Les noms de champs suivent la fiche papier de référence ; aucun texte de règles n'est copié ici.

// Les trois attributs.
export type AttrId = 'corps' | 'coeur' | 'esprit';

// Un attribut : identifiant et libellé affiché.
export interface AttrDef {
  id: AttrId; // identifiant interne
  label: string; // libellé
}

export const ATTRS: AttrDef[] = [
  { id: 'corps', label: 'Corps' },
  { id: 'coeur', label: 'Cœur' },
  { id: 'esprit', label: 'Esprit' },
]; // dans l'ordre de la fiche

// Une compétence : identifiant, libellé et attribut auquel elle se rattache.
export interface SkillDef {
  id: string; // identifiant interne (clé de stockage)
  label: string; // libellé
  attr: AttrId; // attribut dont dépend le seuil de réussite
}

// Les 18 compétences, dans l'ordre de la fiche : 6 sous chaque attribut.
export const SKILLS: SkillDef[] = [
  { id: 'presence', label: 'Présence', attr: 'corps' },
  { id: 'athletisme', label: 'Athlétisme', attr: 'corps' },
  { id: 'vigilance', label: 'Vigilance', attr: 'corps' },
  { id: 'chasse', label: 'Chasse', attr: 'corps' },
  { id: 'chant', label: 'Chant', attr: 'corps' },
  { id: 'artisanat', label: 'Artisanat', attr: 'corps' },
  { id: 'inspiration', label: 'Inspiration', attr: 'coeur' },
  { id: 'voyage', label: 'Voyage', attr: 'coeur' },
  { id: 'intuition', label: 'Intuition', attr: 'coeur' },
  { id: 'soins', label: 'Soins', attr: 'coeur' },
  { id: 'courtoisie', label: 'Courtoisie', attr: 'coeur' },
  { id: 'artguerre', label: 'Art de la Guerre', attr: 'coeur' },
  { id: 'persuasion', label: 'Persuasion', attr: 'esprit' },
  { id: 'discretion', label: 'Discrétion', attr: 'esprit' },
  { id: 'inspection', label: 'Inspection', attr: 'esprit' },
  { id: 'exploration', label: 'Exploration', attr: 'esprit' },
  { id: 'enigmes', label: 'Énigmes', attr: 'esprit' },
  { id: 'connaissances', label: 'Connaissances', attr: 'esprit' },
];

// Les compétences de combat : leur seuil de réussite dépend toujours du Corps.
export const COMBAT_SKILLS: { id: string; label: string }[] = [
  { id: 'haches', label: 'Haches' },
  { id: 'arcs', label: 'Arcs' },
  { id: 'lances', label: 'Lances' },
  { id: 'epees', label: 'Épées' },
];

export const RANG_MAX = 6; // rang maximal d'une compétence
export const ATTR_MIN = 2; // valeur minimale d'un attribut
export const ATTR_MAX = 8; // valeur maximale d'un attribut
export const NB_ARMES = 4; // lignes de l'attirail de guerre
export const NB_ARMURES = 3; // lignes d'armure
export const NB_RAPPEL = 99; // plafond des compteurs (aventure, trésor…)

// Les champs de texte court de la partie « Personnage ».
export const INFO_KEYS = ['culture', 'avantage', 'vocation', 'niveauVie', 'garant', 'voieOmbre'] as const;
export const NB_PARTICULARITES = 3; // deux de la culture + une de la vocation
export const NB_DEFAUTS = 2; // lignes de défauts
export type InfoKey = (typeof INFO_KEYS)[number];

// Une ligne de l'attirail de guerre.
export interface Arme {
  nom: string; // nom de l'arme
  degats: string; // dégâts
  blessure: string; // blessure
  charge: string; // charge
  notes: string; // notes
}

// Une ligne d'armure.
export interface Armure {
  nom: string; // nom de la pièce
  charge: string; // charge
}

// Rang et état « favorisée » d'une compétence.
export interface SkillState {
  rang: number; // 0 à 6
  favorisee: boolean; // compétence favorisée
}

// Compteurs d'endurance.
export interface Endurance {
  max: number; // maximum
  actuelle: number; // actuelle
  charge: number; // charge portée
  fatigue: number; // fatigue
}

// Compteurs d'espoir.
export interface Espoir {
  max: number; // maximum
  actuelle: number; // actuel
  ombre: number; // ombre
  sequelles: number; // séquelles
}

// Les trois états.
export interface Etats {
  epuise: boolean; // Épuisé
  melancolique: boolean; // Mélancolique
  blesse: boolean; // Blessé
}

// Une fiche de personnage complète.
export interface Character {
  id: string; // identifiant unique
  creeLe: number; // date de création (ms)
  modifieLe: number; // date de dernière modification (ms)
  nom: string; // nom du personnage
  info: Record<InfoKey, string>; // champs de la partie « Personnage »
  particularites: string[]; // particularités choisies (NB_PARTICULARITES lignes)
  defauts: string[]; // défauts choisis (NB_DEFAUTS lignes)
  histoire: string; // histoire (texte long)
  equipement: string; // équipement de voyage (texte long)
  recompenses: string; // récompenses et vertus (texte long)
  tresor: number; // trésor
  vaillance: number; // vaillance
  sagesse: number; // sagesse
  aventure: number; // points d'aventure
  progression: number; // points de progression
  communaute: number; // points de communauté
  attrs: Record<AttrId, number>; // valeur des attributs (2 à 8)
  endurance: Endurance; // endurance
  espoir: Espoir; // espoir
  etats: Etats; // états
  blessure: string; // description de la blessure
  skills: Record<string, SkillState>; // compétences (clé = SkillDef.id)
  combat: Record<string, number>; // rang des compétences de combat (clé = id)
  armes: Arme[]; // attirail de guerre
  armures: Armure[]; // armures
  parade: { base: number; bouclier: number; autre: number }; // parade
  protection: { armure: number; casque: number; autre: number }; // protection
}
