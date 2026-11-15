// Liste des jeux. Chaque jeu a sa teinte (0 à 360), qui colore toute l'interface.
export interface Game {
  id: string; // identifiant interne
  name: string; // nom affiché
  hue: number; // teinte de l'interface
}

export const GAMES: Game[] = [{ id: 'tor', name: "L'Anneau Unique", hue: 38 }]; // pour l'instant un seul jeu
