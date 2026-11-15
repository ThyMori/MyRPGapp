// Préférences de l'appareil, dans le menu ⚙ : couleur des dés (noir / blanc) et son.
import { previewDiceSound } from '../audio/diceSound'; // petit « toc » de confirmation
import { otherStyle, sanitizeDiceStyle, sanitizeSound, type DiceStyle } from '../state/prefs'; // règles pures
import { loadJson, saveJson } from '../state/storage'; // mémoire locale
import { byId } from './dom'; // recherche d'élément
import { showToast } from './toast'; // messages

let style: DiceStyle = 'black'; // couleur des dés
let son = true; // son activé ?

// Le son est-il activé ?
export function soundEnabled(): boolean {
  return son; // réglage courant
}

// Pose la couleur sur la page : les variables CSS des dés en dépendent (src/styles/tokens.css).
function appliquerStyle(): void {
  document.documentElement.dataset.dice = style; // attribut lu par le CSS
}

// Met le texte des deux entrées du menu en accord avec les réglages.
function libelles(): void {
  byId('mi-dice-color').textContent = `Couleur des dés : ${style === 'black' ? 'noire' : 'blanche'}`; // état courant
  byId('mi-sound').textContent = `Son des dés : ${son ? 'activé' : 'coupé'}`; // état courant
}

// Branche les préférences. onStyle est appelé quand la couleur change (pour reconstruire les dés).
export function initPrefs(onStyle: (s: DiceStyle) => void): void {
  style = sanitizeDiceStyle(loadJson('diceStyle')); // dernière couleur choisie
  son = sanitizeSound(loadJson('sound')); // dernier réglage du son
  appliquerStyle(); // applique tout de suite (avant la création de la 3D)
  libelles(); // texte des entrées de menu
  byId('mi-dice-color').addEventListener('click', () => {
    style = otherStyle(style); // bascule noir ↔ blanc
    saveJson('diceStyle', style); // mémorise
    appliquerStyle(); // applique
    libelles(); // met à jour le texte
    onStyle(style); // reconstruit les dés
    showToast(style === 'black' ? 'Dés noirs, chiffres rouges.' : 'Dés blancs, chiffres rouges.', 'ok'); // retour
  });
  byId('mi-sound').addEventListener('click', () => {
    son = !son; // bascule
    saveJson('sound', son); // mémorise
    libelles(); // met à jour le texte
    if (son) previewDiceSound(); // le « toc » prouve que le son marche (et réveille l'audio)
    showToast(son ? 'Son des dés activé.' : 'Son des dés coupé.', 'ok'); // retour
  });
}
