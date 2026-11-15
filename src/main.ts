// Point d'entrée de l'app : charge les styles et les polices, puis démarre chaque morceau de l'interface.
import '@fontsource/cormorant-garamond/latin-600.css'; // titres (police libre, hébergée dans l'app)
import '@fontsource/cormorant-garamond/latin-700.css'; // chiffres des dés
import '@fontsource/source-sans-3/latin-400.css'; // texte courant
import '@fontsource/source-sans-3/latin-600.css'; // texte en gras
import './styles/tokens.css'; // couleurs et tailles
import './styles/base.css'; // base
import './styles/layout.css'; // structure
import './styles/roller.css'; // écran du lanceur
import { GAMES } from './games'; // liste des jeux
import { registerServiceWorker, updateAndReload } from './pwa/register'; // mode hors ligne
import { initRoller } from './screens/roller'; // écran du lanceur
import { initDialogs, openDialog } from './ui/dialogs'; // fenêtres
import { byId } from './ui/dom'; // recherche d'élément
import { initInstall } from './ui/install'; // installation
import { initMenus } from './ui/menus'; // menus
import { initNav } from './ui/nav'; // navigation
import { applyGameTheme } from './ui/theme'; // teinte du jeu
import { initToast } from './ui/toast'; // messages
import { VERSION } from './version'; // numéro de version

// Fonctions posées par le script de sécurité de index.html.
declare global {
  interface Window {
    __bootOk?: () => void; // annonce que le démarrage a réussi
    __bootFail?: (e: unknown) => void; // annonce un échec de démarrage
    __resetApp?: () => Promise<void>; // supprime service worker et caches puis recharge
  }
}

try {
  applyGameTheme(GAMES[0]); // teinte du jeu, appliquée avant tout affichage
  byId('version').textContent = `v${VERSION}`; // numéro de version en bas du tiroir
  initToast(); // messages
  initDialogs(); // fenêtres
  initMenus(); // menus
  byId('btn-help').addEventListener('click', () => openDialog('dialog-help')); // bouton « i »
  byId('mi-update').addEventListener('click', () => void updateAndReload()); // « Chercher une mise à jour »
  byId('mi-reset').addEventListener('click', () => void window.__resetApp?.()); // « Réinitialiser et recharger »
  initRoller(); // écran du lanceur
  initNav(); // navigation (ouvre le dernier écran, pose la garde du bouton Retour)
  initInstall(); // installation
  void registerServiceWorker(); // mode hors ligne
  window.__bootOk?.(); // tout est démarré : on arrête le minuteur de sécurité
} catch (e) {
  window.__bootFail?.(e); // affiche l'écran d'erreur avec le bouton de réinitialisation
  throw e; // laisse aussi l'erreur dans la console
}
