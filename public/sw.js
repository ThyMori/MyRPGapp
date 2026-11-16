// Service worker : permet à l'app de démarrer sans réseau.
// Stratégie « réseau d'abord » : on prend toujours la dernière version en ligne, et le cache ne sert qu'en secours.
// La ligne VERSION est mise à jour par scripts/bump-version.mjs (ne pas la modifier à la main).
const VERSION = '0.2.6';
// Nom du cache : change à chaque version, ce qui supprime automatiquement les anciens.
const CACHE = 'myrpgapp-' + VERSION;
// Fichiers au nom fixe à garder dès l'installation. Les fichiers au nom variable (assets/…) sont mis en cache au fil de l'eau.
const COQUILLE = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

// À l'installation : on remplit le cache avec la coquille de l'app.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE) // ouvre (ou crée) le cache de cette version
      .then((cache) => cache.addAll(COQUILLE)) // y copie les fichiers de base
      .then(() => self.skipWaiting()), // active tout de suite cette version, sans attendre la fermeture des onglets
  );
});

// À l'activation : on supprime les caches des anciennes versions et on prend la main sur les pages ouvertes.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys() // liste tous les caches
      .then((noms) => Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n)))) // supprime les vieux
      .then(() => self.clients.claim()), // contrôle immédiatement les pages ouvertes
  );
});

// Cherche une copie en cache : celle de la requête, sinon la page d'accueil si c'est une navigation.
function secours(requete) {
  return caches
    .match(requete) // cherche la copie exacte de cette requête
    .then((enCache) => enCache || (requete.mode === 'navigate' ? caches.match('/index.html') : undefined)); // à défaut, la page d'accueil pour une navigation
}

// À chaque requête : réseau d'abord, cache en secours (réseau coupé OU serveur qui répond une erreur).
self.addEventListener('fetch', (event) => {
  const requete = event.request; // la requête interceptée
  if (requete.method !== 'GET') return; // on ne touche qu'aux lectures
  const url = new URL(requete.url); // adresse décomposée
  if (url.origin !== self.location.origin) return; // jamais de cache pour les autres sites
  event.respondWith(
    fetch(requete) // essaie d'abord le réseau
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone(); // une réponse ne se lit qu'une fois : on en garde une copie
          caches.open(CACHE).then((cache) => cache.put(requete, copie)); // range la copie dans le cache
          return reponse; // renvoie la réponse du réseau
        }
        // Le serveur a répondu une erreur (404, 500…) : on préfère la copie en cache si elle existe.
        return secours(requete).then((enCache) => enCache || reponse); // sinon on rend l'erreur telle quelle
      })
      .catch(() => secours(requete).then((enCache) => enCache || Response.error())), // pas de réseau : cache, sinon erreur réseau
  );
});
