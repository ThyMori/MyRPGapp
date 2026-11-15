// Accès sûr au stockage local du navigateur (il peut être bloqué : mode privé, quota plein…).
// Toutes les clés commencent par « myrpgapp. » pour ne pas se mélanger avec d'autres sites.
const PREFIX = 'myrpgapp.';

// Lit une valeur JSON. Rend undefined si la clé est absente, illisible ou si le stockage est bloqué.
export function loadJson(key: string): unknown {
  try {
    const brut = localStorage.getItem(PREFIX + key); // texte stocké
    return brut === null ? undefined : JSON.parse(brut); // transforme en valeur
  } catch {
    return undefined; // stockage bloqué ou JSON abîmé : on repart de zéro
  }
}

// Écrit une valeur JSON. Rend false si l'écriture a échoué.
export function saveJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value)); // écrit le texte
    return true; // réussi
  } catch {
    return false; // quota plein ou stockage bloqué
  }
}
