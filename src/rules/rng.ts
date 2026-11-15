// Tirage au sort. Une « fonction de tirage » reçoit un nombre max et rend un entier de 0 à max-1.
export type Rng = (max: number) => number; // type d'une fonction de tirage

// Tirage sûr : utilise le hasard cryptographique du navigateur, sans biais statistique.
export const cryptoRng: Rng = (max) => {
  // Refuse les bornes absurdes (non entières, nulles, trop grandes).
  if (!Number.isInteger(max) || max < 1 || max > 2 ** 32) throw new RangeError('Borne de tirage invalide');
  // Plus grand multiple de max sous 2^32 : au-delà, on rejette la valeur pour garder des probabilités égales.
  const limite = Math.floor(2 ** 32 / max) * max;
  const tampon = new Uint32Array(1); // case mémoire où le navigateur écrit le hasard
  let n: number; // valeur tirée
  do {
    crypto.getRandomValues(tampon); // remplit la case avec du hasard sûr
    n = tampon[0]; // lit la valeur
  } while (n >= limite); // recommence si la valeur tombe dans la zone qui fausserait les probabilités
  return n % max; // ramène la valeur dans l'intervalle 0..max-1
};

// Faux tirage pour les tests : rend les valeurs données, dans l'ordre (et vérifie qu'elles respectent la borne).
export function seqRng(valeurs: number[]): Rng {
  let i = 0; // position dans la liste
  return (max) => {
    if (i >= valeurs.length) throw new Error('seqRng : plus de valeurs'); // liste épuisée
    const v = valeurs[i++]; // valeur suivante
    if (v < 0 || v >= max) throw new RangeError(`seqRng : ${v} hors de 0..${max - 1}`); // valeur incompatible avec le dé
    return v; // valeur de test
  };
}
