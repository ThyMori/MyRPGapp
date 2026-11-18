# CLAUDE.md : MyRPGapp

App de jeu de rôle (PWA) : dés 3D, fiches, oracles. Cercle privé, données sur l'appareil. Dépôt public : pas de texte de règles copié.

## Pile
TypeScript + Vite + Vitest, Three.js pour les dés, polices @fontsource auto-hébergées. Hébergement : GitHub Pages en mode « GitHub Actions » (`.github/workflows/pages.yml` = contrôle de version + tests + build), domaine myrpgapp.thierry-morin.com par CNAME vers thymori.github.io chez Squarespace (`public/CNAME`). Netlify en pause (crédits trop vite consommés ; `netlify.toml` annule les builds), Cloudflare écarté (domaine à déplacer chez eux). Détails dans le README. Pas de base de données.

## Conventions
- Textes en français, tutoiement. Chaque ligne de code commentée en français.
- Logique pure (règles, réglages, mise en page des dés) sans DOM ni réseau, testée dans `src/**/*.test.ts`.
- Un fichier par fonction. Couleurs uniquement en variables CSS (`src/styles/tokens.css`), une teinte `--h` par jeu.
- Jamais d'innerHTML avec du texte de l'utilisateur.
- Le résultat d'un jet est tiré par `cryptoRng` ; la 3D ne fait qu'animer.
- Dés : calque plein écran `#dice-canvas` (src/dice3d/DiceStage.ts). Trajectoires, répartition et préférences sont des fonctions pures testées (trajectory.ts, layout.ts, state/prefs.ts). Dés noirs ou blancs = `data-dice` sur `<html>`, chiffres toujours rouges. Sons synthétisés (src/audio), jamais de fichier son. Présages (Œil / Rune sur le dé gardé) : src/ui/omens.ts + omens.css, couleurs `--omen-*`. Rendu 3D des présages : src/omen3d/ (shaders GLSL, chronologie et qualité pures testées), repli SVG.
- Tout nouveau fichier public est ajouté à la liste du cache de `public/sw.js`.

- Listes de choix de la fiche (`src/characters/lists.ts`) : uniquement des noms issus du livre, jamais de description ni de texte de règle.

## Vocabulaire
Dé du Destin, Dés de Maîtrise, Épuisé, Mélancolique, Œil de Sauron, Rune de Gandalf, Favorisé / Défavorisé, SR (seuil de réussite). À confirmer avec le livre.

## Versions
x.y.z, incrémenté à chaque livraison avec `node scripts/bump-version.mjs patch|minor|major "notes"` (jamais à la main). `--check` avant le commit. Le workflow GitHub Pages le vérifie aussi.

## Ergonomie (référence ThyChat)
Tiroir latéral, bouton Retour géré, dernier écran rouvert, menu ⋮ sur téléphone, dialogues natifs, un seul message (toast), aide « i » à jour à chaque fonction, filet de démarrage 8 s.

## À chaque livraison
README (section de la fonction + version), aide intégrée, CHANGELOG, rapport en 5 points (version, Supabase oui/non, testé / non testé, choix à corriger, comment tester).
