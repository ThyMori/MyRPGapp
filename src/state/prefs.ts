// Préférences de l'appareil (couleur des dés, son). Fonctions pures : testables sans navigateur.

// Couleur du corps des dés : noir ou blanc (les chiffres et symboles sont toujours rouges).
export type DiceStyle = 'black' | 'white';

// Remet en ordre la couleur lue dans le stockage (qui peut contenir n'importe quoi) : noir par défaut.
export function sanitizeDiceStyle(raw: unknown): DiceStyle {
  return raw === 'white' ? 'white' : 'black'; // seule valeur reconnue autre que le noir
}

// Remet en ordre le réglage du son : activé par défaut, coupé seulement si la valeur est exactement false.
export function sanitizeSound(raw: unknown): boolean {
  return raw !== false; // tout ce qui n'est pas « false » garde le son
}

// L'autre couleur (pour le bouton qui bascule).
export function otherStyle(s: DiceStyle): DiceStyle {
  return s === 'black' ? 'white' : 'black'; // bascule
}

// Remet en ordre le réglage « annonce Réussite / Échec » : activée par défaut, coupée seulement si la valeur est exactement false.
export function sanitizeVerdict(raw: unknown): boolean {
  return raw !== false; // même règle que le son
}
