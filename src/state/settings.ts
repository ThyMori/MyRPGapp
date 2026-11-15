// Réglages mémorisés sur l'appareil. Les fonctions de ce fichier sont pures (testables sans navigateur).
import { normalizeInput, type RollInput } from '../rules/tor'; // remise en ordre des réglages de jet

// Écrans de l'app.
export const SCREENS = ['roller', 'characters', 'oracles'] as const;
export type ScreenId = (typeof SCREENS)[number]; // l'un des trois écrans
// Écran d'accueil : celui où l'on retombe quand une cible n'existe plus.
export const HOME_SCREEN: ScreenId = 'roller';

// Choisit l'écran à rouvrir : celui mémorisé s'il existe encore, sinon l'écran d'accueil (jamais d'écran vide).
export function pickScreen(saved: unknown): ScreenId {
  return SCREENS.includes(saved as ScreenId) ? (saved as ScreenId) : HOME_SCREEN; // valide ou repli
}

// Reconstruit des réglages de jet à partir d'une valeur lue dans le stockage (peut être absente ou abîmée).
export function sanitizeRollInput(raw: unknown): RollInput {
  const obj = typeof raw === 'object' && raw !== null ? (raw as Partial<RollInput>) : {}; // objet ou objet vide
  return normalizeInput(obj); // valeurs ramenées dans les limites
}

// Un jet gardé dans l'historique.
export interface HistoryEntry {
  id: string; // identifiant unique
  ts: number; // date du jet en millisecondes
  input: RollInput; // réglages utilisés
  outcome: import('../rules/tor').Outcome; // résultat complet
}

// Nombre maximal de jets gardés.
export const HISTORY_MAX = 50;

// Ne garde que les entrées d'historique bien formées (le stockage peut contenir n'importe quoi).
export function sanitizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return []; // pas une liste : historique vide
  const bonnes = raw.filter((e): e is HistoryEntry => {
    if (typeof e !== 'object' || e === null) return false; // pas un objet
    const h = e as Partial<HistoryEntry>; // vue partielle
    return typeof h.id === 'string' && typeof h.ts === 'number' && typeof h.input === 'object' && h.input !== null && typeof h.outcome === 'object' && h.outcome !== null && typeof h.outcome.total === 'number' && typeof h.outcome.level === 'string'; // forme minimale attendue
  });
  return bonnes.slice(0, HISTORY_MAX); // plafonne la taille
}
