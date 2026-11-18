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

## Mise en ligne (GitHub Pages, depuis 0.6.2)

1. GitHub → dépôt `ThyMori/MyRPGapp` → Settings → Pages → **Source : « GitHub Actions »** (https://github.com/ThyMori/MyRPGapp/settings/pages).
2. Le workflow `.github/workflows/pages.yml` se lance à chaque push sur `main` : vérification des versions, tests, `npm run build`, puis publication du dossier `dist`. Si une étape échoue, rien n'est publié et la version précédente reste en ligne (suivi : onglet Actions).
3. Domaine : même page Pages → « Custom domain » `myrpgapp.thierry-morin.com` (le fichier `public/CNAME` le rappelle), puis cocher **Enforce HTTPS** quand le certificat est prêt.
4. Squarespace (Domaines → thierry-morin.com → Paramètres DNS) : CNAME hôte `myrpgapp` vers `thymori.github.io`. Retirer l'ancien CNAME vers `…netlify.app` et le TXT `subdomain-owner-verification` de Netlify.
5. Retour arrière : onglet Actions → ouvrir un ancien déploiement réussi → Re-run all jobs.
6. Netlify est **en pause** : `netlify.toml` ne contient plus qu'une commande `ignore` qui annule tout build (aucun crédit consommé). Pour s'en passer complètement : supprimer le site dans Netlify.

Fixe l'adresse AVANT d'installer l'app sur des téléphones.

### Historique des essais d'hébergement

- **GitHub Pages** (jusqu'à 0.2.2) : abandonné, ses conditions excluent l'usage commercial. Pour y revenir : recréer un workflow de publication, CNAME vers `thymori.github.io`, Settings → Pages. Le fichier `public/CNAME` a été supprimé en 0.2.4.
- **Cloudflare** (essai 0.2.1) : la publication marche (`wrangler.jsonc` publie `dist`, son `name` doit rester identique au projet), mais le domaine ne peut pas y être relié sans déplacer tout `thierry-morin.com` chez Cloudflare (message « No zones match »). Non retenu : le projet Cloudflare et `wrangler.jsonc` ont été supprimés en 0.2.4.
- **Netlify** (0.2.2 à 0.6.1) : un simple CNAME chez Squarespace suffit, mais l'offre gratuite a un quota mensuel de crédits, vite consommé (chaque push = un build). Mis en pause en 0.6.2.
- **GitHub Pages** (retour en 0.6.2) : coût nul et prévisible. Ses conditions d'usage excluent l'usage commercial : sans objet pour un cercle privé, à revoir si l'app devient payante.

## Fonctions livrées

| Version | Fonction |
|---|---|
| 0.9.2 | Fiches : tout ce qui est rempli en écriture manuscrite (Caveat), cases cochées d'une croix au crayon, états lisibles sur le papier |
| 0.9.1 | Fiches de personnages : look de la fiche papier (parchemin crème, encre rouge, cadres, cercles et cases rouges, titres Almendra SC, texte Gentium Plus, deux polices libres OFL hébergées dans l'app) |
| 0.9.0 | **Fiches de personnages** (appareil seulement) : liste, création, duplication, suppression avec confirmation, éditeur à sections repliables, enregistrement automatique, lien avec le lanceur (toucher une compétence) |
| 0.8.1 | Annonce « RÉUSSITE » (or) / « ÉCHEC » (rouge) sobre et silencieuse, en police lisible, dès que les dés sont immobiles ; retrait du style arcade et des voix de 0.7.0 / 0.8.0 ; réglage dans le menu ⚙ |
| 0.6.2 | Retour sur GitHub Pages (workflow `pages.yml` + `public/CNAME`), Netlify mis en pause (`netlify.toml` annule les builds) ; aucun changement dans l'app |
| 0.6.0 | Dés annulés par l'état Épuisé : ils se flétrissent (ternis, recroquevillés, lueur rouge à chaque battement) avec un battement de cœur qui faiblit |
| 0.5.0 | Fête des runes de réussite (τ) sur un jet réussi : 1 rune = sympa (1,8 s), 2 = grandiose (2,8 s), 3 ou plus = épique (3,8 s), en 3D avec son ; jouée après un éventuel présage ; repli en dessins plats |
| 0.4.0 | Présages en rendu 3D (shaders WebGL) : Œil de feu avec flammes, braises, battements, tremblement au cor ; bâton de Gandalf avec cristal rayonnant, onde de lumière, poussière d'étoiles ; réglage « Effets des présages » (élevés / réduits / simples), baisse automatique si l'appareil rame |
| 0.3.0 | Présages : scène plein écran animée avec son quand l'Œil de Sauron (feu, battements, cor dissonant) ou la Rune de Gandalf (bâton en lumière bleue, carillon féérique) sort sur le dé du Destin gardé ; Œil et rune redessinés avec plus de détails ; plus de trait sous le 6 du d6 |
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

### Présages (0.3.0)

- `src/ui/omens.ts` : construit la scène (dessins SVG) et la ferme au toucher, au bouton Retour (`close-omen`) ou au lancer suivant ; `src/styles/omens.css` : mouvements (≈ 2,8 s) ; `src/audio/omenSound.ts` : sons synthétisés.
- Seulement pour le dé du Destin **gardé** (Favorisé / Défavorisé : l'autre dé ne déclenche rien). Le réglage « Son des dés » coupe aussi le son des présages.
- Animations réduites : image fixe pendant 1,8 s, sans mouvement.

### Rendu 3D des présages (0.4.0)

- `src/omen3d/shaders.ts` : programmes graphiques (GLSL), un rectangle plein écran dont chaque pixel est calculé par la carte graphique (aucune image, aucune bibliothèque) ; `OmenGL.ts` : moteur WebGL ; `timeline.ts` : chronologie pure (testée) synchronisée avec les sons ; `quality.ts` : niveaux d'effets (pur, testé).
- Menu ⚙ « Effets des présages » : **élevés** (résolution jusqu'à 1,5×), **réduits** (0,6×, moins de couches de bruit), **simples** (dessins plats SVG de 0.3.0). Si les 12 premières images sont lentes (> 30 ms), la qualité baisse toute seule.
- **Fête des tau (0.5.0)** : `tauTier` (`src/omen3d/tier.ts`) donne le niveau d'après le nombre de runes des dés de Maîtrise, seulement si le jet est réussi (pas sur un échec, pas pour la rune de Gandalf). Jusqu'à 5 tau sont dessinés. Les scènes s'enchaînent (`playOmens`) : présage puis fête. Chronologie : `tauState` dans `timeline.ts`.
- **Dés flétris (0.6.0)** : `src/dice3d/wither.ts` (chronologie pure testée : flétrissement et battements) partagée par l'animation (`DiceStage.ts`) et le son (`src/audio/heartSound.ts`). Concerne les dés de Maîtrise « ignorés » par Épuisé ; commence 0,25 s après l'arrivée et dure 1,9 s (dés ramenés à ~60 % de leur taille) ; les dés restent 1,2 s de plus à l'écran. Le battement mêle un fondamental (~100-120 Hz) et son octave, plus un claquement : les graves purs sont inaudibles sur un haut-parleur de téléphone. Animations réduites : état flétri montré directement, sans battements.
- **Annonce Réussite / Échec (0.8.1)** : `src/ui/verdict.ts` (une bande au centre de l'écran), `omens.css` (style, police Cormorant Garamond déjà dans l'app), `src/ui/verdictPlan.ts` (`planHold`, pur et testé). Elle apparaît dès que les dés sont immobiles (2,4 s), **sans son**, **en même temps** que le présage (Œil / rune) et la fête des tau, qui s'animent **par-dessus** elle : calque `#verdict` (z-index 52, sous les présages à 55), indépendant de la file des présages. Elle reste 1,2 s de plus que la dernière animation (`dureeTotaleMs`), et les dés restent visibles jusqu'à sa fin. Un toucher ou Retour ferme tout. Réglage dans le menu ⚙. Les essais précédents (arcade pixel en 0.7.0, arcade fantasy avec voix synthétisée en 0.8.0) ont été jugés illisibles et envahissants : ils sont dans l'historique git si besoin.
- Repli automatique sur les dessins plats si WebGL manque ou si le contexte est perdu.

| Seuil de réussite d'un attribut (fiche) | 20 − valeur de l'attribut (valeur de 2 à 8) ; compétences de combat : Corps |
| Compétence favorisée (fiche) | dé du Destin Favorisé dans le lanceur |

## Fiches de personnages (0.9.0)

- Code : `src/characters/` (`model.ts` types et listes, `sanitize.ts` remise en ordre, `derive.ts` calculs et préparation d'un jet, tests dans `characters.test.ts`), `src/state/characters.ts` (stockage), `src/screens/characters.ts` (écran), `src/ui/sheetFields.ts` (champs), `src/styles/characters.css`.
- Look (0.9.1) : papier `--paper`, encre `--ink-red`, texte `--ink-text` (tokens.css) ; titres en Almendra SC et texte en Gentium Plus, alternatives libres aux polices de la fiche. Les couleurs ont été relevées sur la fiche. L'en-tête et le tiroir de l'app gardent le thème sombre.
- Mise en page inspirée de la fiche papier alternative d'Anneau Unique (mêmes rubriques), **sans reprendre ses illustrations ni ses textes** : dépôt public, la fiche d'origine est « pour usage personnel ».
- Rubriques : Personnage (+ Histoire), Vaillance / Sagesse / Points, Attributs (valeur 2 à 8, seuil calculé), 18 compétences (rang 0 à 6, case favorisée), Endurance, Espoir, États (Épuisé, Mélancolique, Blessé + blessure), Récompenses et Vertus, Combat (4 compétences de combat, attirail de guerre, armures, parade et protection avec totaux), Équipement de voyage et Trésor.
- Données : clé `myrpgapp.characters` (liste de fiches), `myrpgapp.character-open` (dernière fiche ouverte, rouverte au démarrage). Une fiche abîmée ou ancienne est complétée par des valeurs sûres (`sanitizeCharacter`), jamais perdue en bloc.
- Lien avec le lanceur : toucher le nom d'une compétence règle le lanceur (dés de Maîtrise = rang, SR = 20 − attribut, Favorisé si cochée, Épuisé / Mélancolique repris des états) et l'ouvre.
- Bouton Retour : ferme une fenêtre, puis la fiche (retour à la liste), puis revient au lanceur.
- Limite connue : les données sont **seulement sur l'appareil** (vider les données du navigateur les efface). L'export / import JSON est prévu.

## Dépannage

- Écran d'erreur au démarrage : bouton « Réinitialiser et recharger ».
- Pas de dés visibles : l'appareil n'a pas WebGL, un message l'indique, le jet marche quand même.
- Pas de son : vérifie « Son des dés » dans le menu ⚙ (et le volume « média » du téléphone, pas la sonnerie).
- Nouvelle version non visible : menu ⚙ → recharger, ou fermer et rouvrir l'app.

## Feuille de route

1. Fiches de personnages : export / import JSON, portrait, Épuisé automatique selon l'endurance (à valider avec le livre).
2. Oracles avec jets.
3. Choix de la teinte par jeu, autres jeux et dés.
4. Partage entre utilisateurs (nécessitera Supabase).
5. Accessibilité à compléter.

## Versions

Ne jamais modifier les numéros à la main : `node scripts/bump-version.mjs patch|minor|major "note"`, puis `node scripts/bump-version.mjs --check`.
