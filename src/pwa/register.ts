// Service worker : enregistrement, recherche de mise à jour, rattrapage au retour au premier plan.
import { showToast } from '../ui/toast'; // messages

let registration: ServiceWorkerRegistration | null = null; // inscription courante

// Enregistre le service worker (sauf en développement, où il gênerait les rechargements).
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return; // non supporté ou mode développement
  const avaitControleur = navigator.serviceWorker.controller !== null; // l'app était-elle déjà sous contrôle d'un service worker ?
  try {
    registration = await navigator.serviceWorker.register('/sw.js'); // inscription
  } catch (e) {
    console.warn('Service worker non enregistré :', e); // l'app fonctionne quand même, sans mode hors ligne
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (avaitControleur) showToast('Une nouvelle version est prête. Recharge la page pour l’utiliser.', 'ok'); // nouvelle version installée
  });
  // Au retour au premier plan, on cherche discrètement une nouvelle version (l'app « rattrape » ce qu'elle a manqué).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registration?.update().catch(() => undefined); // ignore les échecs réseau
  });
}

// Cherche la dernière version puis recharge la page.
export async function updateAndReload(): Promise<void> {
  showToast('Recherche de la dernière version…'); // retour immédiat
  try {
    await registration?.update(); // demande au navigateur de revérifier le service worker
  } catch {
    /* pas de réseau : on recharge quand même depuis le cache */
  }
  location.reload(); // recharge (réseau d'abord : on récupère la dernière version si elle est en ligne)
}
