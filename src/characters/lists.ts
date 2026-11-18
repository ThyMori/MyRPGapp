// Listes de choix de la fiche (noms seulement, relevés dans le livre de base). Aucune description ni texte de règle : dépôt public.
// Logique pure, sans DOM ni stockage.

// Une culture héroïque et ce qui s'y rattache.
export interface Culture {
  nom: string; // nom de la culture
  avantage: string; // avantage culturel
  niveauVie: string; // niveau de vie de départ
  particularites: string[]; // particularités proposées (on en choisit deux)
  vertus: string[]; // vertus propres à la culture
}

export const CULTURES: Culture[] = [
  { nom: 'Bardides', avantage: 'Intrépide', niveauVie: 'Prospère', particularites: ['Beau', 'Courageux', 'Entêté', 'Fier', 'Généreux', 'Grand', 'Impétueux', 'Passionné'], vertus: ['Ami des Nains', 'Cram', 'Grande destinée', 'Langage des oiseaux', 'Pourfendeur de dragons', 'Tir féroce'] },
  { nom: 'Elfes du Lindon', avantage: 'Précision elfique', niveauVie: 'Modeste', particularites: ['Beau', 'Circonspect', 'Jovial', 'Majestueux', 'Patient', 'Rapide', 'Subtil', 'Vue perçante'], vertus: ['Elbereth Gilthoniel !', 'Fléau de l’Ombre', 'Mémoire des temps anciens', 'Mortelle archerie', 'Rempart contre les spectres', 'Rêves elfiques'] },
  { nom: 'Hobbits de la Comté', avantage: 'Bon sens hobbit', niveauVie: 'Courant', particularites: ['Affable', 'Curieux', 'Honorable', 'Jovial', 'Loyal', 'Passionné', 'Rustre', 'Vue perçante'], vertus: ['Amis pour la vie', 'Art de la disparition', 'Courageux si besoin', 'Droit au but', 'Petit peuple', 'Solide comme un roc'] },
  { nom: 'Hommes de Bree', avantage: 'Originaire de Bree', niveauVie: 'Courant', particularites: ['Affable', 'Curieux', 'Généreux', 'Loyal', 'Malin', 'Patient', 'Rustre', 'Sincère'], vertus: ['Aussi étrange que des nouvelles de Bree', 'Avenant', 'Courage du désespoir', 'L’art de fumer', 'Obstination', 'Poney de Bree'] },
  { nom: 'Nains du Peuple de Durin', avantage: 'Infatigable', niveauVie: 'Prospère', particularites: ['Circonspect', 'Entêté', 'Fier', 'Impétueux', 'Majestueux', 'Malin', 'Secret', 'Sévère'], vertus: ['Baruk Khazâd !', 'Dur comme le fer', 'Esprit indomptable', 'L’obscurité pour les affaires obscures', 'Sorts brisés', 'Voie de Durin'] },
  { nom: 'Rôdeurs du Nord', avantage: 'Rois des Hommes', niveauVie: 'Modeste', particularites: ['Courageux', 'Grand', 'Honorable', 'Rapide', 'Secret', 'Sévère', 'Sincère', 'Subtil'], vertus: ['Clairvoyance des ancêtres', 'Emblème dévoilé', 'Endurance du rôdeur', 'Force d’esprit', 'Héritier d’Arnor', 'Sentiers des terres sauvages'] },
];

// Une voie de l'Ombre et les défauts qui s'y rattachent.
export interface Voie {
  nom: string; // nom de la voie
  defauts: string[]; // défauts de cette voie
}

export const VOIES: Voie[] = [
  { nom: 'Attrait du pouvoir', defauts: ['Amer', 'Arrogant', 'Présomptueux', 'Tyrannique'] },
  { nom: 'Attrait des secrets', defauts: ['Calculateur', 'Fourbe', 'Hautain', 'Méprisant'] },
  { nom: 'Folie itinérante', defauts: ['Distrait', 'Fainéant', 'Indifférent', 'Poltron'] },
  { nom: 'Mal du Dragon', defauts: ['Avide', 'Cruel', 'Malhonnête', 'Meurtrier', 'Suspicieux', 'Voleur'] },
  { nom: 'Malédiction de vengeance', defauts: ['Brutal', 'Rancunier'] },
  { nom: 'Voie du désespoir', defauts: ['Craintif', 'Hésitant', 'Honteux', 'Troublé'] },
];

// Une vocation : sa particularité supplémentaire et sa voie de l'Ombre.
export interface Vocation {
  nom: string; // nom de la vocation
  particularite: string; // particularité supplémentaire
  voie: string; // voie de l'Ombre associée
}

export const VOCATIONS: Vocation[] = [
  { nom: 'Capitaine', particularite: 'Commandement', voie: 'Attrait du pouvoir' },
  { nom: 'Champion', particularite: 'Connaissance des ennemis', voie: 'Malédiction de vengeance' },
  { nom: 'Chasseur de trésors', particularite: 'Monte-en-l’air', voie: 'Mal du Dragon' },
  { nom: 'Érudit', particularite: 'Rimes de savoir', voie: 'Attrait des secrets' },
  { nom: 'Messager', particularite: 'Folklore', voie: 'Folie itinérante' },
  { nom: 'Protecteur', particularite: 'Conscience de l’Ombre', voie: 'Voie du désespoir' },
];

export const NIVEAUX_VIE = ['Pauvre', 'Modeste', 'Courant', 'Prospère', 'Riche', 'Très riche']; // les six niveaux de vie

export const GARANTS = ['Balin, fils de Fundin', 'Bilbo Sacquet', 'Círdan le Charpentier', 'Gandalf le Gris', 'Gilraen, fille de Dírhael', 'Tom Bombadil et Baie d’Or']; // garants de départ

export const RECOMPENSES_DEPART = ['Acéré (arme)', 'Ajusté (armure ou casque)', 'Astucieux (armure, casque ou bouclier)', 'Dévastateur (arme)', 'Féroce (arme)', 'Renforcé (bouclier)']; // récompenses de départ

export const VERTUS_COMMUNES = ['Assurance', 'Habileté', 'Main sûre', 'Maîtrise', 'Résistance', 'Vivacité']; // vertus communes de départ

// Cherche une culture par son nom (undefined si inconnue ou vide).
export function findCulture(nom: string): Culture | undefined {
  return CULTURES.find((c) => c.nom === nom); // première correspondance exacte
}

// Cherche une vocation par son nom.
export function findVocation(nom: string): Vocation | undefined {
  return VOCATIONS.find((v) => v.nom === nom); // première correspondance exacte
}

// Particularités proposées pour une culture ; toutes (sans doublon, triées) si la culture est inconnue.
export function particularitesPour(culture: string): string[] {
  const c = findCulture(culture); // culture choisie ?
  if (c) return c.particularites; // celles de la culture
  return [...new Set(CULTURES.flatMap((x) => x.particularites))].sort((a, b) => a.localeCompare(b, 'fr')); // sinon toutes
}

// Défauts proposés pour une voie ; tous si la voie est inconnue.
export function defautsPour(voie: string): string[] {
  const v = VOIES.find((x) => x.nom === voie); // voie choisie ?
  return v ? v.defauts : VOIES.flatMap((x) => x.defauts).sort((a, b) => a.localeCompare(b, 'fr')); // sinon tous
}

// Réglages à appliquer quand on choisit une culture : avantage et niveau de vie de départ (rien si culture vide ou inconnue).
export function reglagesCulture(nom: string): { avantage: string; niveauVie: string } | null {
  const c = findCulture(nom); // culture
  return c ? { avantage: c.avantage, niveauVie: c.niveauVie } : null; // valeurs liées
}

// Réglages à appliquer quand on choisit une vocation : voie de l'Ombre et particularité supplémentaire.
export function reglagesVocation(nom: string): { voie: string; particularite: string } | null {
  const v = findVocation(nom); // vocation
  return v ? { voie: v.voie, particularite: v.particularite } : null; // valeurs liées
}
