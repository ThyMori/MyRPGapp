// Navigation : changement d'écran, tiroir latéral (bouton, glissement), bouton « Retour » du téléphone.
import { HOME_SCREEN, SCREENS, pickScreen, type ScreenId } from '../state/settings'; // écrans et repli
import { loadJson, saveJson } from '../state/storage'; // mémoire locale
import { decideBack } from './backPolicy'; // décision du bouton Retour
import { closeTopDialog, isDialogOpen } from './dialogs'; // fenêtres
import { closeOmen, isOmenOpen } from './omens'; // scènes de présage
import { all, byId } from './dom'; // outils de recherche d'éléments
import { closeMenus, isMenuOpen } from './menus'; // menus
import { showToast } from './toast'; // messages
import { closeCharacter, isCharacterOpen } from '../screens/characters'; // fiche ouverte

const grandEcran = window.matchMedia('(min-width: 900px)'); // true quand le tiroir est une colonne fixe
let courant: ScreenId = HOME_SCREEN; // écran affiché
let sortieArmee = false; // un premier « Retour » a prévenu qu'un second quittera l'app
let minuteurSortie: number | undefined; // compte à rebours du premier avertissement
const accroches = new Map<ScreenId, () => void>(); // actions à faire quand un écran apparaît

// Permet à un écran de réagir quand il devient visible.
export function onScreenShown(id: ScreenId, fn: () => void): void {
  accroches.set(id, fn); // mémorise l'action
}

// Écran actuellement affiché.
export function currentScreen(): ScreenId {
  return courant; // état courant
}

// Affiche un écran, met à jour le titre, le menu actif et les actions de l'en-tête, et mémorise le choix.
export function showScreen(id: ScreenId): void {
  courant = id; // nouvel écran
  for (const s of all<HTMLElement>('.screen')) s.hidden = s.dataset.screen !== id; // montre celui-là, cache les autres
  for (const b of all<HTMLElement>('.nav-item')) {
    if (b.dataset.screen === id) b.setAttribute('aria-current', 'page'); // entrée active
    else b.removeAttribute('aria-current'); // les autres ne le sont plus
  }
  const entree = all<HTMLElement>('.nav-item').find((b) => b.dataset.screen === id); // bouton du menu correspondant
  byId('head-title').textContent = entree?.textContent?.trim() ?? ''; // titre de l'en-tête
  for (const t of all<HTMLElement>('[data-screens]')) t.hidden = !(t.dataset.screens ?? '').split(' ').includes(id); // actions propres à un écran
  saveJson('screen', id); // mémorise pour la prochaine ouverture
  closeDrawer(); // referme le tiroir sur téléphone
  accroches.get(id)?.(); // prévient l'écran
}

// Tiroir : ouvert ou fermé.
export function isDrawerOpen(): boolean {
  return document.body.classList.contains('drawer-open'); // classe posée sur la page
}

// Ouvre le tiroir (téléphone).
export function openDrawer(): void {
  if (grandEcran.matches) return; // sur grand écran, il est toujours visible
  document.body.classList.add('drawer-open'); // fait glisser le tiroir
  byId('backdrop').hidden = false; // montre le voile
  byId('btn-drawer').setAttribute('aria-expanded', 'true'); // état pour les lecteurs d'écran
  (byId('sidebar') as HTMLElement & { inert: boolean }).inert = false; // le tiroir redevient accessible au clavier
}

// Ferme le tiroir.
export function closeDrawer(): void {
  document.body.classList.remove('drawer-open'); // fait rentrer le tiroir
  byId('backdrop').hidden = true; // cache le voile
  byId('btn-drawer').setAttribute('aria-expanded', 'false'); // état pour les lecteurs d'écran
  (byId('sidebar') as HTMLElement & { inert: boolean }).inert = !grandEcran.matches; // fermé sur téléphone : hors du clavier
}

// Pose deux entrées dans l'historique : « base » (derrière) et « garde » (où vit l'app).
// Ainsi « Retour » arrive d'abord sur nous, qui décidons quoi fermer, au lieu de quitter l'app.
function armerHistorique(): void {
  history.replaceState({ myrpg: 'base' }, ''); // entrée actuelle = base
  history.pushState({ myrpg: 'garde' }, ''); // entrée de garde par-dessus
}

// Remet une entrée de garde par-dessus la base.
function regarder(): void {
  history.pushState({ myrpg: 'garde' }, ''); // nouvelle entrée de garde
}

// Réagit à l'appui sur « Retour ».
function surRetour(): void {
  if ((history.state as { myrpg?: string } | null)?.myrpg === 'garde') return; // avance dans l'historique : rien à faire
  const action = decideBack({
    omenOpen: isOmenOpen(), // présage affiché ?
    dialogOpen: isDialogOpen(), // fenêtre ouverte ?
    menuOpen: isMenuOpen(), // menu ouvert ?
    drawerOpen: isDrawerOpen(), // tiroir ouvert ?
    characterOpen: isCharacterOpen(), // fiche ouverte ?
    screen: courant, // écran affiché
    homeScreen: HOME_SCREEN, // écran d'accueil
    exitArmed: sortieArmee, // avertissement déjà donné ?
  });
  switch (action) {
    case 'close-omen':
      closeOmen(); // ferme le présage
      regarder(); // reprend la garde
      break;
    case 'close-dialog':
      closeTopDialog(); // ferme la fenêtre
      regarder(); // reprend la garde
      break;
    case 'close-menu':
      closeMenus(); // ferme le menu
      regarder(); // reprend la garde
      break;
    case 'close-drawer':
      closeDrawer(); // ferme le tiroir
      regarder(); // reprend la garde
      break;
    case 'close-character':
      closeCharacter(); // retour à la liste des personnages
      regarder(); // reprend la garde
      break;
    case 'go-home':
      showScreen(HOME_SCREEN); // retour à l'accueil
      regarder(); // reprend la garde
      break;
    case 'arm-exit': {
      sortieArmee = true; // le prochain « Retour » quittera
      showToast('Appuie encore sur Retour pour quitter'); // prévient
      // On ne remet PAS la garde : le prochain « Retour » quitte donc vraiment l'app.
      const desarmer = () => {
        if (!sortieArmee) return; // déjà fait
        sortieArmee = false; // on n'attend plus de second appui
        window.clearTimeout(minuteurSortie); // arrête le compte à rebours
        regarder(); // remet la garde
      };
      minuteurSortie = window.setTimeout(desarmer, 2500); // 2,5 secondes pour confirmer
      document.addEventListener('pointerdown', desarmer, { once: true }); // toucher l'écran annule aussi l'avertissement
      break;
    }
    case 'exit':
      break; // on ne fait rien : l'historique est vide, le navigateur quitte l'app
  }
}

// Glissement horizontal : vers la droite ouvre le tiroir, vers la gauche le ferme.
function initGlissement(): void {
  let x0 = 0; // position de départ horizontale
  let y0 = 0; // position de départ verticale
  document.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true }); // note le départ
  document.addEventListener('touchend', (e) => {
    if (grandEcran.matches) return; // pas de tiroir à glisser sur grand écran
    const dx = e.changedTouches[0].clientX - x0; // déplacement horizontal
    const dy = e.changedTouches[0].clientY - y0; // déplacement vertical
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return; // trop court ou pas assez horizontal
    if (dx > 0 && !isDrawerOpen() && !isDialogOpen()) openDrawer(); // glissé vers la droite : ouvre
    else if (dx < 0 && isDrawerOpen()) closeDrawer(); // glissé vers la gauche : ferme
  }, { passive: true });
}

// Démarre la navigation : écran initial, tiroir, boutons, historique.
export function initNav(): void {
  closeDrawer(); // état initial du tiroir
  byId('btn-drawer').addEventListener('click', () => (isDrawerOpen() ? closeDrawer() : openDrawer())); // bouton ☰
  byId('backdrop').addEventListener('click', closeDrawer); // toucher le voile ferme
  grandEcran.addEventListener('change', closeDrawer); // rotation ou redimensionnement : remet l'état propre
  for (const b of all<HTMLElement>('.nav-item')) b.addEventListener('click', () => showScreen(b.dataset.screen as ScreenId)); // entrées du menu
  for (const b of all<HTMLElement>('[data-goto]')) b.addEventListener('click', () => showScreen(b.dataset.goto as ScreenId)); // boutons « retour au lanceur »
  const lien = new URLSearchParams(location.search).get('ecran'); // lien profond : ?ecran=oracles
  const cible = SCREENS.includes(lien as ScreenId) ? lien : loadJson('screen'); // priorité au lien, sinon dernier écran
  showScreen(pickScreen(cible)); // ouvre l'écran, avec repli sur l'accueil si la cible n'existe plus
  armerHistorique(); // pose la garde du bouton Retour
  window.addEventListener('popstate', surRetour); // écoute le bouton Retour
  initGlissement(); // active le glissement
}
