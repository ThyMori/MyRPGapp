// Vocabulaire du jeu, défini une seule fois et utilisé partout dans les textes de l'app (voir aussi index.html).
// ⚠ À confirmer avec la version française du livre : il suffit de corriger ici et dans index.html.
import type { Level } from './rules/tor'; // niveaux de résultat

export const VOCAB = {
  featDie: 'dé du Destin', // d12 spécial
  successDice: 'dés de Maîtrise', // d6 du rang de compétence
  weary: 'Épuisé', // état
  miserable: 'Mélancolique', // état
  eye: "Œil de Sauron", // face du dé du Destin
  gandalf: 'Rune de Gandalf', // face du dé du Destin
  rune: 'rune', // symbole du dé de Maîtrise
  levels: {
    echec: 'Échec',
    reussite: 'Réussite',
    grande: 'Grande réussite',
    extraordinaire: 'Réussite extraordinaire',
  } satisfies Record<Level, string>,
} as const;
