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

## Mise en ligne (à faire une fois, par toi)

1. GitHub : https://github.com/ThyMori/MyRPGapp/settings/pages → **Source : GitHub Actions**.
2. Même page → **Custom domain** : `myrpgapp.thierry-morin.com`, puis cocher **Enforce HTTPS** (après quelques minutes).
3. Squarespace : Domaines → thierry-morin.com → **Paramètres DNS** → ajouter un enregistrement **CNAME**, hôte `myrpgapp`, valeur `thymori.github.io`.
4. Si le premier déploiement (onglet Actions) a échoué avant l'étape 1 : bouton « Re-run all jobs ».

Fixe l'adresse AVANT d'installer l'app sur des téléphones.

## Fonctions livrées

| Version | Fonction |
|---|---|
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

Le résultat est **tiré** par `crypto.getRandomValues`. La 3D ne fait qu'**animer** (~1 s) un lancer qui se termine exactement sur les faces tirées. Un toucher interrompt l'animation ; elle est coupée si l'appareil réduit les animations.

## Dépannage

- Écran d'erreur au démarrage : bouton « Réinitialiser et recharger ».
- Pas de dés visibles : l'appareil n'a pas WebGL, un message l'indique, le jet marche quand même.
- Nouvelle version non visible : menu ⚙ → recharger, ou fermer et rouvrir l'app.

## Feuille de route

1. Fiches de personnages (appareil, puis export/import JSON).
2. Oracles avec jets.
3. Choix de la teinte par jeu, autres jeux et dés.
4. Partage entre utilisateurs (nécessitera Supabase).
5. Accessibilité à compléter.

## Versions

Ne jamais modifier les numéros à la main : `node scripts/bump-version.mjs patch|minor|major "note"`, puis `node scripts/bump-version.mjs --check`.
