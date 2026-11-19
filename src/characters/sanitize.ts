// Remise en ordre d'une fiche lue dans le stockage (qui peut être vide, ancienne ou abîmée). Logique pure.
import { ATTRS, ATTR_MAX, ATTR_MIN, COMBAT_SKILLS, INFO_KEYS, NB_ARMES, NB_ARMURES, NB_DEFAUTS, NB_PARTICULARITES, NB_RAPPEL, RANG_MAX, SKILLS, type Arme, type Armure, type Character, type InfoKey } from './model'; // modèle

// Texte : une chaîne, coupée à max caractères (vide sinon).
export function texte(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.slice(0, max) : ''; // chaîne ou vide
}

// Entier borné : valeur arrondie entre min et max, ou défaut si ce n'est pas un nombre.
export function entier(v: unknown, min: number, max: number, defaut: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : defaut; // entier ou défaut
  return Math.min(max, Math.max(min, n)); // ramené dans la plage
}

// Objet : l'objet lui-même, ou un objet vide.
function obj(v: unknown): Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}; // objet sûr
}

// Fiche vierge (le nom et les dates viennent de l'appelant, pour garder cette fonction pure).
export function emptyCharacter(id: string, now: number): Character {
  const info = Object.fromEntries(INFO_KEYS.map((k) => [k, ''])) as Record<InfoKey, string>; // champs vides
  return {
    id,
    creeLe: now,
    modifieLe: now,
    nom: '',
    info,
    particularites: Array.from({ length: NB_PARTICULARITES }, () => ''),
    defauts: Array.from({ length: NB_DEFAUTS }, () => ''),
    histoire: '',
    equipement: '',
    recompenses: '',
    tresor: 0,
    vaillance: 0,
    sagesse: 0,
    aventure: 0,
    progression: 0,
    communaute: 0,
    attrs: { corps: 4, coeur: 4, esprit: 4 }, // valeur moyenne par défaut
    endurance: { max: 0, actuelle: 0, charge: 0, fatigue: 0 },
    espoir: { max: 0, actuelle: 0, ombre: 0, sequelles: 0 },
    etats: { epuise: false, melancolique: false, blesse: false },
    blessure: '',
    skills: Object.fromEntries(SKILLS.map((s) => [s.id, { rang: 0, favorisee: false }])),
    combat: Object.fromEntries(COMBAT_SKILLS.map((s) => [s.id, 0])),
    armes: Array.from({ length: NB_ARMES }, (): Arme => ({ nom: '', degats: '', blessure: '', charge: '', notes: '' })),
    armures: Array.from({ length: NB_ARMURES }, (): Armure => ({ nom: '', charge: '' })),
    parade: { base: 0, bouclier: 0, autre: 0 },
    protection: { armure: 0, casque: 0, autre: 0 },
    srBase: 20,
    auto: true, // une nouvelle fiche se calcule seule
    verrou: false,
    depart: { favCulture: '', favVocation: ['', ''], armePrincipale: '', armeSecondaire: '' },
  };
}

// Liste de n textes courts : relit un tableau ; si absent, reprend l'ancien champ texte libre dans la première case (rien n'est perdu).
function liste(v: unknown, ancien: unknown, n: number): string[] {
  const src = Array.isArray(v) ? v : []; // tableau enregistré, s'il existe
  const out = Array.from({ length: n }, (_, i) => texte(src[i], 60)); // n cases
  if (!Array.isArray(v) && typeof ancien === 'string' && ancien.trim() !== '') out[0] = texte(ancien.trim(), 60); // ancien texte libre
  return out;
}

// Reconstruit une fiche valide à partir de n'importe quelle valeur. Rend null si elle n'a même pas d'identifiant.
export function sanitizeCharacter(raw: unknown): Character | null {
  const r = obj(raw); // vue sûre
  if (typeof r.id !== 'string' || r.id === '') return null; // sans identifiant, impossible à retrouver
  const base = emptyCharacter(r.id.slice(0, 64), 0); // fiche vierge à compléter
  const info = obj(r.info); // champs « Personnage »
  const attrs = obj(r.attrs); // attributs
  const end = obj(r.endurance); // endurance
  const esp = obj(r.espoir); // espoir
  const etats = obj(r.etats); // états
  const sk = obj(r.skills); // compétences
  const cb = obj(r.combat); // combat
  const par = obj(r.parade); // parade
  const pro = obj(r.protection); // protection
  const dep = obj(r.depart); // choix de départ
  const cpt = (v: unknown) => entier(v, 0, NB_RAPPEL, 0); // compteur 0..99
  return {
    id: base.id,
    creeLe: entier(r.creeLe, 0, Number.MAX_SAFE_INTEGER, 0),
    modifieLe: entier(r.modifieLe, 0, Number.MAX_SAFE_INTEGER, 0),
    nom: texte(r.nom, 80),
    info: Object.fromEntries(INFO_KEYS.map((k) => [k, texte(info[k], 120)])) as Record<InfoKey, string>,
    particularites: liste(r.particularites, info.particularites, NB_PARTICULARITES),
    defauts: liste(r.defauts, info.defauts, NB_DEFAUTS),
    histoire: texte(r.histoire, 4000),
    equipement: texte(r.equipement, 2000),
    recompenses: texte(r.recompenses, 2000),
    tresor: entier(r.tresor, 0, 9999, 0),
    vaillance: cpt(r.vaillance),
    sagesse: cpt(r.sagesse),
    aventure: cpt(r.aventure),
    progression: cpt(r.progression),
    communaute: cpt(r.communaute),
    attrs: Object.fromEntries(ATTRS.map((a) => [a.id, entier(attrs[a.id], ATTR_MIN, ATTR_MAX, 4)])) as Character['attrs'],
    endurance: { max: cpt(end.max), actuelle: cpt(end.actuelle), charge: cpt(end.charge), fatigue: cpt(end.fatigue) },
    espoir: { max: cpt(esp.max), actuelle: cpt(esp.actuelle), ombre: cpt(esp.ombre), sequelles: cpt(esp.sequelles) },
    etats: { epuise: etats.epuise === true, melancolique: etats.melancolique === true, blesse: etats.blesse === true },
    blessure: texte(r.blessure, 300),
    skills: Object.fromEntries(SKILLS.map((s) => {
      const e = obj(sk[s.id]); // état de la compétence
      return [s.id, { rang: entier(e.rang, 0, RANG_MAX, 0), favorisee: e.favorisee === true }];
    })),
    combat: Object.fromEntries(COMBAT_SKILLS.map((s) => [s.id, entier(cb[s.id], 0, RANG_MAX, 0)])),
    armes: base.armes.map((_, i) => {
      const a = obj(Array.isArray(r.armes) ? r.armes[i] : undefined); // ligne i
      return { nom: texte(a.nom, 60), degats: texte(a.degats, 20), blessure: texte(a.blessure, 20), charge: texte(a.charge, 20), notes: texte(a.notes, 120) };
    }),
    armures: base.armures.map((_, i) => {
      const a = obj(Array.isArray(r.armures) ? r.armures[i] : undefined); // ligne i
      return { nom: texte(a.nom, 60), charge: texte(a.charge, 20) };
    }),
    parade: { base: cpt(par.base), bouclier: cpt(par.bouclier), autre: cpt(par.autre) },
    protection: { armure: cpt(pro.armure), casque: cpt(pro.casque), autre: cpt(pro.autre) },
    srBase: r.srBase === 18 ? 18 : 20, // 20 sauf demande explicite de 18
    auto: r.auto === true, // une ancienne fiche garde ses valeurs : calculs coupés tant qu'on ne les active pas
    verrou: r.verrou === true,
    depart: { favCulture: texte(dep.favCulture, 30), favVocation: [texte(Array.isArray(dep.favVocation) ? dep.favVocation[0] : '', 30), texte(Array.isArray(dep.favVocation) ? dep.favVocation[1] : '', 30)], armePrincipale: texte(dep.armePrincipale, 30), armeSecondaire: texte(dep.armeSecondaire, 30) },
  };
}

// Reconstruit la liste des fiches : ignore les entrées abîmées et les identifiants en double.
export function sanitizeCharacters(raw: unknown): Character[] {
  if (!Array.isArray(raw)) return []; // pas une liste : aucune fiche
  const vus = new Set<string>(); // identifiants déjà pris
  const liste: Character[] = []; // fiches valides
  for (const item of raw) {
    const c = sanitizeCharacter(item); // fiche remise en ordre
    if (!c || vus.has(c.id)) continue; // abîmée ou doublon : on saute
    vus.add(c.id); // note l'identifiant
    liste.push(c); // garde
  }
  return liste;
}
