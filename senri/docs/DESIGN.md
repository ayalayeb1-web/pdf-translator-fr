# Senri : direction artistique et design system

## Trois directions étudiées

| | A. **Encre & Lumière** (retenue) | B. Atelier nocturne | C. Carnet de voyage |
|---|---|---|---|
| Idée | Papier chaud, encre profonde, une seule couleur lumineuse par langue | Interface sombre type studio audio, accents néon | Textures papier, tampons, illustrations |
| Typo | Fraunces (titres, mot étudié) + Manrope (interface) | Sans grotesque unique | Script manuscrit + serif |
| Forces | Calme, lisible longtemps, premium, éditorial | Spectaculaire, met l'audio en avant | Chaleureux, mémorable |
| Faiblesses | Demande de la rigueur dans les espacements | Fatigant sur de longues sessions, peu lisible pour le japonais | Vite « décoratif », vieillit mal, coûteux à produire |
| Verdict | **Choisie** : sert l'apprentissage, s'adapte aux deux langues par la seule couleur d'accent | Gardée comme thème sombre de A | Écartée |

## Identité

- **Nom** : **Senri** (千里, « mille ri »), la très longue route. Il fait écho au proverbe 千里の道も一歩から : « un voyage de mille ri commence par un pas ». C'est l'esprit des petites étapes quotidiennes.
- **Emblème** : une route en « S » (comme Senri) qui serpente en perspective vers un soleil couchant, derrière des crêtes en couches et sous un ciel de crépuscule. C'est le même univers que les paysages de l'application.
- **Version simplifiée pour 16 à 32 px** (soleil et route épaisse) : à cette taille, les détails de l'emblème ne seraient plus lisibles.
- **Fichiers** :
  - `assets/brand/senri-logo.svg` (emblème), `senri-logo-small.svg` (petites tailles), `senri-wordmark.svg` (emblème et nom, 千里)
  - PNG de 16 à 1024 px
  - `ico/senri.ico` (de 16 à 256 px), configuré comme icône Windows dans `windows/runner/resources/app_icon.ico`
  - `web/` : favicon.ico et favicon.svg, icônes 192 et 512, apple-touch
  - `splash/` : écran de démarrage 1920×1080
- **Splash animé** : l'emblème apparaît en fondu pendant le chargement de la base et des cours.

## Tokens (`lib/ui/theme.dart`)

- **Couleurs (clair)** : papier `#F6F2EA`, surface `#FFFDF9`, encre `#1A1E29`, encre douce `#555B68`, filet `#E6DED0`, succès `#2C7A5E`, erreur `#A8323E`.
  Accent japonais : vermillon shu `#C63D2B`. Accent espagnol : safran terracotta `#C2611A`. Accent italien : vert cyprès toscan `#2E7A55`. Thème sombre complet, réglable : Système / Clair / Sombre.
- **Espacement** : grille de 4 pt (4, 8, 12, 16, 20, 24, 32, 40, 48).
- **Rayons** : 8, 12, 18, 26. **Mouvement** : 140, 240 et 420 ms, easeOutCubic.
- **Typographie** : display 56/40/30, titre 24/20, UI 18/15/13, corps 16/14, libellés 12/10.5 en capitales espacées. Noto Sans JP en repli pour le japonais.

## Principes desktop

- Barre de titre personnalisée : zone de glisser, fil d'Ariane, recherche, plein écran, boutons fenêtre.
- Navigation latérale repliable, zone centrale large (jusqu'à 1180 px), panneaux maître-détail (Parcours, Speaking Lab).
- Raccourcis partout : Ctrl 1…5, Ctrl K, Ctrl R, F11, 1–4 et Entrée dans les exercices.
- Clic droit sur tout mot : écouter, écouter lentement, ajouter au vocabulaire, copier.
- Survol : élévation douce et curseur main. Animations d'entrée en cascade.
- Aucun emoji comme graphisme principal : icônes Material arrondies et glyphes typographiques (あ, ñ).
