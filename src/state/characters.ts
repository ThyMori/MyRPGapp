// Liste des personnages gardée sur l'appareil. Les fonctions de lecture et d'écriture passent par storage.ts.
import { sanitizeCharacters } from '../characters/sanitize'; // remise en ordre
import type { Character } from '../characters/model'; // fiche
import { loadJson, saveJson } from './storage'; // mémoire locale

// Lit les fiches (liste vide si rien n'est enregistré ou si c'est abîmé).
export function loadCharacters(): Character[] {
  return sanitizeCharacters(loadJson('characters')); // fiches valides
}

// Enregistre les fiches. Rend false si le stockage est bloqué ou plein.
export function saveCharacters(list: Character[]): boolean {
  return saveJson('characters', list); // écrit
}
