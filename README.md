# MyRPGapp

Application de jeu de rôle (PWA) : dés en 3D, fiches de personnages, oracles.
Cercle privé, données **sur l'appareil** uniquement pour l'instant. Premier jeu : **L'Anneau Unique** (The One Ring 2e).

Adresse prévue : https://myrpgapp.thierry-morin.com

> Dépôt public : aucun texte de livre de règles n'est copié ici. Les symboles (œil, rune) sont dessinés par l'app.

## Mise en route (développement)

```powershell
npm install        # installe les dépendances (une seule fois)
npm run dev        # serveur local, l'adresse s'affiche dans le terminal
npm test           # lance les tests
npm run build      # contrôle de types + construction dans dist/
```

## Mise en ligne (Netlify, depuis 0.2.3)

1. Netlify (https://app.netlify.com) : site `myrpgapp` relié au dépôt `ThyMori/MyRPGapp`, redéployé à chaque push sur `main`.
2. Les réglages sont dans `netlify.toml` : vérification des versions, tests, puis `npm run build` ; dossier publié `dist` ; Node 22. Si un test échoue, rien n'est publié et la version précédente reste en ligne.
3. Domaine : Netlify → Domain management → `myrpgapp.thierry-morin.com`, certificat HTTPS automatique.
4. Squarespace (Domaines → thierry-morin.com → Paramètres DNS) : CNAME hôte `myrpgapp` vers l'adresse `…netlify.app` du site, plus un TXT `subdomain-owner-verification` (preuve de propriété demandée par Netlify, à laisser en place).
5. Aperçus : chaque branche ou demande de fusion a sa propre adresse de test (Netlify → Deploys).
6. Retour arrière : Netlify → Deploys → choisir un ancien déploiement → Publish deploy.

Fixe l'adresse AVANT d'installer l'app sur des téléphones.

### Historique des essais d'hébergement

- **GitHub Pages** (jusqu'à 0.2.2) : abandonné, ses conditions excluent l'usage commercial. Pour y revenir : recréer un workflow de publication, CNAME vers `thymori.github.io`, Settings → Pages. Le fichier `public/CNAME` a été supprimé en 0.2.4.
- **Cloudflare** (essai 0.2.1) : la publication marche (`wrangler.jsonc` publie `dist`, son `name` doit rester identique au projet), mais le domaine ne peut pas y être relié sans déplacer tout `thierry-morin.com` chez Cloudflare (message « No zones match »). Non retenu : le projet Cloudflare et `wrangler.jsonc` ont été supprimés en 0.2.4.
- **Netlify** (essai 0.2.2) : retenu, un simple CNAME chez Squarespace suffit. Offre gratuite à quota mensuel de crédits : vérifier la page de tarifs avant tout usage pro.

## Fonctions livrées

| Version | Fonction |
|---|---|
| 0.2.7 | Chiffres et symboles gravés (creusés) dans les dés (relief calculé par `src/dice3d/engrave.ts`) ; symbole de réussite en tau grec (τ), petit, avec le 6 au milieu de la face |
| 0.2.6 | Dés blancs couleur crème ; angles et arêtes des dés arrondis, faces toujours plates (`src/dice3d/rounded.ts`) |
| 0.2.5 | Mise à jour fiable lors d'un changement d'hébergeur ou d'une panne : si le serveur répond 404 ou une erreur 5xx, l'app s'affiche depuis le cache (comme hors ligne) ; une erreur n'est jamais gardée en cache ; 9 tests du service worker |
| 0.2.4 | Nettoyage après l'essai : suppression de `wrangler.jsonc` et de `public/CNAME` ; aucun changement dans l'app |
| 0.2.3 | Netlify devient l'hébergement officiel ; tests et contrôle de version avant chaque publication ; arrêt de la publication GitHub Pages ; aucun changement dans l'app |
| 0.2.2 | Essai de publication sur Netlify (ajout de `netlify.toml`) ; aucun changement dans l'app |
| 0.2.1 | Réparation de la publication Cloudflare (ajout de `wrangler.jsonc`) ; aucun changement dans l'app |
| 0.2.0 | Dés plein écran (arrivée par le bas, rebonds sur les bords, effacement en fondu après 3 s) ; dés noirs ou blancs aux chiffres rouges, plus gros ; bruit des dés (roulement et chocs), les deux réglages dans le menu ⚙ |
| 0.1.0 | Squelette PWA (tiroir, bouton Retour, dernier écran, aide « i », installation, hors ligne) ; lanceur de dés 3D de L'Anneau Unique (dé du Destin d12 + dés de Maîtrise d6), historique des jets |

## Droits par rôle

Sans objet : pas de comptes, tout reste sur l'appareil.

## Migrations Supabase

Aucune : pas de base de données.

## Règles à vérifier avec le livre

Centralisées dans `src/rules/tor.ts` (objet `REGLES`). Codées de mémoire, **à confirmer** :

| Règle | Valeur codée |
|---|---|
| Dé du Destin | d12 : faces 1 à 10, Œil (valeur 0), Rune de Gandalf (valeur 12, réussite automatique) |
| Dés de Maîtrise | d6, la face 6 = rune de réussite |
| Épuisé | les dés de Maîtrise 1 à 3 comptent 0 |
| Mélancolique + Œil | échec automatique |
| Favorisé / Défavorisé | 2 dés du Destin, on garde le meilleur / le pire |
| Réussite | total ≥ SR (défaut 14, plage 2–24), 0 à 8 dés de Maîtrise |
| Niveaux | 1 rune = Grande réussite ; 2 runes ou plus = Réussite extraordinaire |

Le vocabulaire français (Dé du Destin, Dés de Maîtrise, Épuisé, Mélancolique, SR…) est à confirmer.

## Principe des dés 3D

Le résultat est **tiré** par `crypto.getRandomValues`. La 3D ne fait qu'**animer** (~1,1 s) un lancer qui se termine exactement sur les faces tirées.

- **Plein écran** : un calque `<canvas id="dice-canvas">` couvre tout l'écran, transparent. Il capte les appuis seulement pendant le lancer (un appui arrête les dés) ; ensuite les appuis passent à travers. Les dés restent 3 s puis s'effacent en fondu.
- **Trajectoire** (`src/dice3d/trajectory.ts`) : chaque dé arrive du bas, file vers une cible parfois « repliée » derrière un mur, rebondit, puis se pose à sa place (`layout.ts`, répartition sans chevauchement).
- **Couleurs** : `--die-body`, `--die-ink`, `--die-edge` dans `tokens.css` ; l'attribut `data-dice` (`black` / `white`) sur `<html>` choisit le jeu de couleurs.
- **Son** (`src/audio/diceSound.ts`) : fabriqué par l'appareil (Web Audio), aucun fichier. Un « toc » par rebond et par choc, programmé d'après la trajectoire.
- Animation coupée si l'appareil réduit les animations (les dés apparaissent posés, un seul « toc »).

## Dépannage

- Écran d'erreur au démarrage : bouton « Réinitialiser et recharger ».
- Pas de dés visibles : l'appareil n'a pas WebGL, un message l'indique, le jet marche quand même.
- Pas de son : vérifie « Son des dés » dans le menu ⚙ (et le volume « média » du téléphone, pas la sonnerie).
- Nouvelle version non visible : menu ⚙ → recharger, ou fermer et rouvrir l'app.

## Feuille de route

1. Fiches de personnages (appareil, puis export/import JSON).
2. Oracles avec jets.
3. Choix de la teinte par jeu, autres jeux et dés.
4. Partage entre utilisateurs (nécessitera Supabase).
5. Accessibilité à compléter.

## Versions

Ne jamais modifier les numéros à la main : `node scripts/bump-version.mjs patch|minor|major "note"`, puis `node scripts/bump-version.mjs --check`.
