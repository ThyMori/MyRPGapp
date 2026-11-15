// Teinte du jeu : une seule variable CSS (--h) colore toute l'interface, la barre du navigateur et les dés.
import { readCss } from '../dice3d/colors'; // lecture d'une variable CSS
import type { Game } from '../games'; // type d'un jeu

// Applique la teinte d'un jeu.
export function applyGameTheme(game: Game): void {
  document.documentElement.style.setProperty('--h', String(game.hue)); // change la teinte de toute l'interface
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', readCss('--bg')); // aligne la barre du navigateur sur le fond
}
