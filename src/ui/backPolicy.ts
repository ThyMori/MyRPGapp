// Décide quoi faire quand on appuie sur « Retour » du téléphone. Fonction pure (testable).
// Principe : fermer d'abord ce qui est ouvert, puis remonter d'un niveau, puis demander confirmation avant de quitter.

// Ce que l'app sait de son état au moment de l'appui.
export interface BackContext {
  dialogOpen: boolean; // une fenêtre de dialogue est ouverte
  menuOpen: boolean; // un menu (⋮ ou roue crantée) est ouvert
  drawerOpen: boolean; // le tiroir latéral est ouvert (téléphone)
  screen: string; // écran affiché
  homeScreen: string; // écran d'accueil
  exitArmed: boolean; // un premier « Retour » vient d'avertir que le suivant quittera l'app
}

// Les actions possibles.
export type BackAction = 'close-dialog' | 'close-menu' | 'close-drawer' | 'go-home' | 'arm-exit' | 'exit';

// Choisit l'action, dans l'ordre de priorité.
export function decideBack(c: BackContext): BackAction {
  if (c.dialogOpen) return 'close-dialog'; // 1. la fenêtre ouverte
  if (c.menuOpen) return 'close-menu'; // 2. le menu ouvert
  if (c.drawerOpen) return 'close-drawer'; // 3. le tiroir ouvert
  if (c.screen !== c.homeScreen) return 'go-home'; // 4. retour à l'écran d'accueil
  return c.exitArmed ? 'exit' : 'arm-exit'; // 5. quitter, mais seulement au deuxième appui
}
