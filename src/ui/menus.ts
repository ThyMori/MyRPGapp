// Menus déroulants : le menu ⋮ de l'en-tête et le menu de la roue crantée. Un seul menu ouvert à la fois.
import { byId } from './dom'; // outil de recherche d'élément

// Un menu = un bouton qui l'ouvre + son panneau + la façon de l'afficher.
interface Menu {
  button: HTMLElement; // bouton d'ouverture
  panel: HTMLElement; // panneau déroulé
  isOpen: () => boolean; // le menu est-il ouvert (et visible) ?
  set: (open: boolean) => void; // ouvre ou ferme
}

const menus: Menu[] = []; // tous les menus de la page

// Ferme tous les menus.
export function closeMenus(): void {
  for (const m of menus) m.set(false); // ferme chacun
}

// Un menu est-il ouvert ?
export function isMenuOpen(): boolean {
  return menus.some((m) => m.isOpen()); // au moins un ouvert
}

// Crée un menu et branche ses réactions.
function register(button: HTMLElement, panel: HTMLElement, isOpen: () => boolean, set: (open: boolean) => void): void {
  menus.push({ button, panel, isOpen, set }); // l'ajoute à la liste
  button.addEventListener('click', () => {
    const ouvrir = !isOpen(); // inverse l'état
    closeMenus(); // un seul menu à la fois
    set(ouvrir); // applique
  });
  panel.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('button')) set(false); // choisir une action referme le menu
  });
}

// Branche les deux menus de l'app.
export function initMenus(): void {
  const more = byId('btn-more'); // bouton ⋮
  const tools = byId('head-tools'); // actions de l'en-tête
  register(
    more,
    tools,
    () => tools.classList.contains('open') && more.offsetParent !== null, // ouvert ET visible (le ⋮ disparaît sur grand écran)
    (open) => {
      tools.classList.toggle('open', open); // classe d'ouverture
      more.setAttribute('aria-expanded', String(open)); // état pour les lecteurs d'écran
    },
  );
  const gear = byId('btn-settings'); // roue crantée
  const reglages = byId('menu-settings'); // menu des réglages
  register(
    gear,
    reglages,
    () => !reglages.hidden, // ouvert si non caché
    (open) => {
      reglages.hidden = !open; // montre ou cache
      gear.setAttribute('aria-expanded', String(open)); // état pour les lecteurs d'écran
    },
  );
  // Toucher n'importe où ailleurs ferme les menus.
  document.addEventListener('pointerdown', (e) => {
    const cible = e.target as Node; // l'endroit touché
    for (const m of menus) {
      if (m.isOpen() && !m.panel.contains(cible) && !m.button.contains(cible)) m.set(false); // hors du menu : on le ferme
    }
  });
  // Échap ferme le menu et rend le focus à son bouton.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return; // seulement Échap
    for (const m of menus) {
      if (m.isOpen()) {
        m.set(false); // ferme
        m.button.focus(); // rend le focus au bouton
      }
    }
  });
  // Si l'écran change de taille (rotation…), on referme les menus pour éviter un état incohérent.
  window.matchMedia('(min-width: 700px)').addEventListener('change', closeMenus);
}
