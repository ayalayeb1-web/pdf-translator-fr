# Architecture de Voya

```
lib/
  main.dart              démarrage : fenêtre, base, cours, voix
  app.dart               MaterialApp, thèmes, splash animé, onboarding / shell
  content/models.dart    Course → Level (CECRL) → Unit → Lesson → Item / Exercise
  core/
    store.dart           base SQLite locale (sqflite_common_ffi + SQLite embarqué)
    srs.dart             répétition espacée (Leitner adaptatif aux erreurs)
    practice.dart        génération des activités et correction des réponses (pur Dart, testé)
    app_state.dart       état applicatif (ChangeNotifier), statistiques réelles
  audio/
    speech.dart          synthèse vocale système (Windows : WinRT), lecteur intégré
    recorder.dart        micro (WAV) et lecture, pour le Speaking Lab
  platform/desktop.dart  fenêtre, plein écran, notifications natives ; no-op sur mobile
  ui/                    design system, shell desktop et écrans
assets/content/*.json    contenu des cours (exporté par tools/export-content.mjs)
```

## Base de données locale (`voya.db`)

Stockée dans `%APPDATA%\com.voya\voya\` sous Windows. Le chemin exact est affiché dans Paramètres → Données.

| Table | Contenu |
|---|---|
| settings | langue, niveau, objectif, minutes/jour, voix, vitesse, thème |
| progress | leçons terminées et score au premier essai |
| cards | file SRS : boîte, échéance, répétitions, oublis |
| vocab | vocabulaire personnel (ajouté depuis n'importe quelle leçon) |
| activity | XP et secondes de pratique par jour |
| mistakes | historique des erreurs : consigne, réponse donnée, réponse attendue |
| recordings | enregistrements du Speaking Lab et avis de l'apprenant |

L'export JSON complet se fait dans Paramètres → Données.

## Pédagogie

- **Niveaux** : CECRL A1 à C2, avec repères JLPT (N5 → N1) et DELE. Les niveaux A1 et A2 sont rédigés : 90 leçons de japonais et 51 d'espagnol. B1 à C2 sont affichés comme programme, clairement marqués et sans contenu factice.
- **Objectif vérifiable** pour chaque leçon, rappelé au début et évalué à la fin.
- **Activités actives** : reconnaissance, écoute (choisir ce qu'on entend), production écrite, phrase à trous, remise en ordre, compréhension de texte.
- **Adaptation aux erreurs** : un exercice raté revient en fin de leçon (« seconde chance ») et la carte repart en boîte 0 avec retour dans 10 minutes. Les cartes ratées plusieurs fois sont « fragiles » et passent en priorité.
- **Correction tolérante** pour ce qui n'est pas l'objet de l'exercice : voyelles longues en rōmaji, accents espagnols (accepté, mais signalé), majuscules, ponctuation.

## Mobile (Android / iOS)

Les dossiers `android/` et `ios/` sont générés. Toute la logique (contenu, base, SRS, pratique, état) est indépendante de la plateforme. Seul `platform/desktop.dart` est spécifique au bureau et devient inactif sur mobile. Il resterait à adapter le shell (navigation basse à la place de la barre latérale) et à configurer les permissions micro (AndroidManifest, Info.plist).

## Services externes : non inclus, à brancher via un serveur

**Aucune clé API n'est intégrée à l'application, et il ne doit jamais y en avoir.** Les fonctions suivantes nécessitent un petit serveur Voya (proxy) qui garde les clés côté serveur :

| Fonction | Service possible | Ce qu'il faut |
|---|---|---|
| Voix neuronales studio | Azure Speech, Google TTS, ElevenLabs | Clé du service sur le serveur, plus un endpoint `/tts?text=&voice=` qui renvoie un MP3 mis en cache |
| Analyse de prononciation | Azure Pronunciation Assessment | Endpoint `/assess` : reçoit le WAV et le texte, renvoie les scores par mot et par phonème |
| Partenaire de conversation | Un LLM (par ex. Claude via l'API Anthropic) | Endpoint `/chat` avec le niveau et le scénario, plus le rapport de fin (erreurs, corrections, expressions) |

Tant que ces services n'existent pas, l'interface ne propose aucun bouton factice et le dit explicitement (Paramètres et Speaking Lab).
