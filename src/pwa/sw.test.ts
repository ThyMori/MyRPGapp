// Tests du service worker (public/sw.js) : on exécute son vrai code dans un faux environnement.
import { describe, expect, it } from 'vitest'; // outils de test
import codeSw from '../../public/sw.js?raw'; // texte du fichier sw.js, lu tel quel

// Requête simplifiée : seuls les champs lus par le service worker.
interface FausseRequete {
  method: string; // GET, POST…
  url: string; // adresse complète
  mode: string; // « navigate » pour une page, autre chose pour un fichier
}
// Événement « fetch » simplifié.
interface FauxEvenement {
  request: FausseRequete; // la requête interceptée
  respondWith: (reponse: Promise<Response>) => void; // le service worker y dépose sa réponse
}

const ORIGINE = 'https://exemple.test'; // faux site sur lequel « tourne » le service worker

// Monte un faux environnement, exécute sw.js dedans et rend de quoi simuler des requêtes.
function monter(reseau: (r: FausseRequete) => Promise<Response>, enCacheInitial: Record<string, string> = {}) {
  const cache = new Map<string, Response>(); // faux cache : adresse -> réponse
  for (const [adresse, texte] of Object.entries(enCacheInitial)) cache.set(ORIGINE + adresse, new Response(texte)); // copies déjà en cache
  const ecouteurs: Record<string, (e: FauxEvenement) => void> = {}; // fonctions enregistrées par sw.js
  const soi = {
    location: { origin: ORIGINE }, // origine du faux site
    addEventListener: (nom: string, f: (e: FauxEvenement) => void) => {
      ecouteurs[nom] = f; // retient la fonction pour pouvoir l'appeler
    },
  };
  const caches = {
    open: async () => ({
      put: async (r: FausseRequete, rep: Response) => {
        cache.set(r.url, rep); // range la réponse sous l'adresse de la requête
      },
    }),
    match: async (r: FausseRequete | string) => {
      const adresse = typeof r === 'string' ? ORIGINE + r : r.url; // une chaîne est un chemin, sinon une requête
      return cache.get(adresse)?.clone(); // copie de la réponse en cache, ou rien
    },
  };
  new Function('self', 'caches', 'fetch', 'Response', codeSw)(soi, caches, reseau, Response); // exécute sw.js
  // Simule une requête et rend la réponse choisie par le service worker (null s'il ne répond pas).
  async function demander(requete: FausseRequete): Promise<Response | null> {
    const prise: { reponse: Promise<Response> | null } = { reponse: null }; // où le service worker dépose sa réponse
    ecouteurs.fetch({ request: requete, respondWith: (p) => (prise.reponse = p) }); // déclenche l'événement
    const reponse = prise.reponse ? await prise.reponse : null; // attend la réponse
    await new Promise((fin) => setTimeout(fin, 0)); // laisse finir l'écriture en cache, que sw.js n'attend pas
    return reponse;
  }
  return { cache, demander };
}

// Une page (navigation) et un fichier (script) de l'app.
const PAGE: FausseRequete = { method: 'GET', url: ORIGINE + '/', mode: 'navigate' };
const AUTRE_PAGE: FausseRequete = { method: 'GET', url: ORIGINE + '/autre', mode: 'navigate' };
const FICHIER: FausseRequete = { method: 'GET', url: ORIGINE + '/assets/app.js', mode: 'no-cors' };

describe('service worker : réseau d’abord, cache en secours', () => {
  it('serveur en bonne santé : rend la réponse du réseau et la range en cache', async () => {
    const sw = monter(async () => new Response('réseau', { status: 200 })); // le réseau répond bien
    const rep = await sw.demander(PAGE); // une page demandée
    expect(await rep?.text()).toBe('réseau'); // on obtient la réponse du réseau
    expect(await sw.cache.get(PAGE.url)?.text()).toBe('réseau'); // et elle est rangée en cache
  });

  it('serveur qui répond 404 : rend la copie en cache', async () => {
    const sw = monter(async () => new Response('introuvable', { status: 404 }), { '/': 'en cache' }); // l'ancien serveur répond 404
    const rep = await sw.demander(PAGE);
    expect(await rep?.text()).toBe('en cache'); // l'app gardée en cache s'affiche
  });

  it('serveur qui répond 500 : rend aussi la copie en cache', async () => {
    const sw = monter(async () => new Response('panne', { status: 500 }), { '/': 'en cache' });
    const rep = await sw.demander(PAGE);
    expect(await rep?.text()).toBe('en cache');
  });

  it('une erreur n’est jamais rangée en cache', async () => {
    const sw = monter(async () => new Response('introuvable', { status: 404 })); // 404 et rien en cache
    await sw.demander(PAGE);
    expect(sw.cache.size).toBe(0); // le 404 n'a pas été gardé
  });

  it('404 sans aucune copie en cache : rend l’erreur du serveur', async () => {
    const sw = monter(async () => new Response('introuvable', { status: 404 }));
    const rep = await sw.demander(FICHIER);
    expect(rep?.status).toBe(404); // pas de secours possible, l'erreur est rendue telle quelle
  });

  it('404 sur une page inconnue : rend la page d’accueil en cache', async () => {
    const sw = monter(async () => new Response('introuvable', { status: 404 }), { '/index.html': 'accueil' });
    const rep = await sw.demander(AUTRE_PAGE);
    expect(await rep?.text()).toBe('accueil'); // une navigation retombe sur index.html
  });

  it('réseau coupé : rend la copie en cache', async () => {
    const sw = monter(async () => Promise.reject(new TypeError('hors ligne')), { '/': 'en cache' });
    const rep = await sw.demander(PAGE);
    expect(await rep?.text()).toBe('en cache');
  });

  it('réseau coupé sans copie : une page retombe sur l’accueil, un fichier donne une erreur réseau', async () => {
    const coupe = async () => Promise.reject(new TypeError('hors ligne')); // réseau coupé
    const avecAccueil = monter(coupe, { '/index.html': 'accueil' });
    expect(await (await avecAccueil.demander(AUTRE_PAGE))?.text()).toBe('accueil'); // une page : l'accueil
    const sansRien = monter(coupe);
    expect((await sansRien.demander(FICHIER))?.type).toBe('error'); // un fichier : erreur réseau
  });

  it('ignore ce qui n’est pas une lecture ou ce qui vient d’un autre site', async () => {
    const sw = monter(async () => new Response('réseau'));
    expect(await sw.demander({ ...PAGE, method: 'POST' })).toBeNull(); // une écriture : pas touchée
    expect(await sw.demander({ ...PAGE, url: 'https://autre.test/' })).toBeNull(); // un autre site : pas touché
  });
});
