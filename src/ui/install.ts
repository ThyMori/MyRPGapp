// Installation de l'app : guide adapté à l'appareil, bouton « Installer maintenant » quand le navigateur le permet,
// bandeau reportable une semaine (trois fois au plus), entrée du menu des réglages.
import { dismissBanner, sanitizeInstallState, shouldShowBanner } from '../pwa/installPolicy'; // règle du bandeau
import { detectPlatform, installSteps } from '../pwa/platform'; // détection d'appareil
import { loadJson, saveJson } from '../state/storage'; // mémoire locale
import { openDialog } from './dialogs'; // fenêtres
import { byId } from './dom'; // outil de recherche d'élément

// Événement fourni par Chrome pour proposer l'installation directe (absent de Firefox et Safari).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>; // ouvre la proposition d'installation
}

let differe: BeforeInstallPromptEvent | null = null; // événement mémorisé en attendant le clic

// L'app est-elle déjà installée (lancée en plein écran) ?
function estInstallee(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true; // Android/ordinateur ou iPhone
}

// Remplit et ouvre le guide d'installation.
function ouvrirGuide(): void {
  const plateforme = detectPlatform(navigator.userAgent); // appareil détecté
  byId('install-intro').textContent = estInstallee() ? 'L’app est déjà installée sur cet appareil.' : 'Voici comment l’installer sur cet appareil :'; // introduction
  const liste = byId('install-steps'); // liste des étapes
  liste.replaceChildren(...installSteps(plateforme).map((t) => Object.assign(document.createElement('li'), { textContent: t }))); // une ligne par étape (texte seulement)
  byId('install-now').hidden = differe === null; // bouton direct seulement si le navigateur l'autorise
  openDialog('dialog-install'); // ouvre la fenêtre
}

// Met à jour l'entrée du menu : cachée si l'app est déjà installée.
function majMenu(): void {
  byId('mi-install').hidden = estInstallee(); // pas utile une fois installée
}

// Affiche le bandeau si les règles le permettent.
function majBandeau(): void {
  const etat = sanitizeInstallState(loadJson('install')); // état mémorisé
  byId('install-banner').hidden = !shouldShowBanner(etat, estInstallee(), Date.now()); // montre ou cache
}

// Branche tout ce qui touche à l'installation.
export function initInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // empêche l'affichage automatique
    differe = e as BeforeInstallPromptEvent; // garde l'événement pour le bouton
  });
  window.addEventListener('appinstalled', () => {
    differe = null; // plus rien à proposer
    majMenu(); // met à jour le menu
    majBandeau(); // cache le bandeau
  });
  byId('mi-install').addEventListener('click', ouvrirGuide); // menu des réglages
  byId('banner-how').addEventListener('click', ouvrirGuide); // bouton du bandeau
  byId('banner-later').addEventListener('click', () => {
    saveJson('install', dismissBanner(sanitizeInstallState(loadJson('install')), Date.now())); // report d'une semaine
    majBandeau(); // cache le bandeau
  });
  byId('install-now').addEventListener('click', async () => {
    if (!differe) return; // rien à lancer
    await differe.prompt(); // ouvre la proposition du navigateur
    differe = null; // l'événement ne sert qu'une fois
    byId('install-now').hidden = true; // cache le bouton
  });
  majMenu(); // état initial du menu
  majBandeau(); // état initial du bandeau
}
