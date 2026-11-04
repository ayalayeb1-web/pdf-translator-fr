# Compiler et installer Senri sous Windows

## Télécharger (sans rien installer)

Chaque push sur la branche lance le workflow **« Senri · Windows build »** (`.github/workflows/senri-windows.yml`) sur une machine Windows de GitHub. Ce workflow :

1. analyse le code et lance les tests unitaires et widgets ;
2. compile `Senri.exe` en mode release ;
3. lance le test d'intégration dans une vraie fenêtre Windows (onboarding, leçon complète, toutes les sections) ;
4. démarre l'EXE et vérifie qu'il reste ouvert ;
5. construit `Senri-Setup-0.1.0.exe` (Inno Setup), puis teste une installation et une désinstallation silencieuses ;
6. construit le MSIX et le ZIP portable ;
7. publie les fichiers dans la préversion GitHub **senri-v0.1.0**, ainsi qu'en artefact du workflow.

**Installateur recommandé** : `Senri-Setup-0.1.0.exe`. Il ne demande pas de droits administrateur, ajoute un raccourci dans le menu Démarrer et une icône facultative sur le bureau. Windows SmartScreen peut afficher « Éditeur inconnu » car l'exécutable n'est pas signé : cliquez sur *Informations complémentaires*, puis *Exécuter quand même*. Une signature de code (certificat payant) supprimerait cet avertissement.

**MSIX** : il est signé avec un certificat de test. Pour l'installer, il faut d'abord faire confiance à ce certificat (Propriétés → Signatures numériques → Installer le certificat → Ordinateur local → Personnes autorisées). Pour une distribution publique, signez-le avec votre certificat ou publiez-le sur le Microsoft Store.

## Compiler soi-même

Prérequis : Windows 10 ou 11, [Flutter 3.47](https://docs.flutter.dev/get-started/install/windows/desktop), et Visual Studio 2022 avec la charge de travail « Développement Desktop en C++ ».

```powershell
cd senri
flutter pub get
flutter test
flutter run -d windows                # développement
flutter build windows --release       # build\windows\x64\runner\Release\Senri.exe
iscc installer\senri.iss               # build\installer\Senri-Setup-0.1.0.exe  (Inno Setup 6)
dart run msix:create                  # paquet MSIX
```

## Voix

Senri utilise les voix installées sur Windows. Pour une bonne prononciation, allez dans Paramètres Windows → Heure et langue → Voix → Ajouter des voix, puis installez **Japonais**, **Espagnol (Espagne)** et **Italien (Italie)**. Redémarrez ensuite Senri. Le choix de la voix se fait dans Senri → Paramètres → Voix.

## Micro

Le Speaking Lab demande l'accès au micro. S'il est refusé, allez dans Paramètres Windows → Confidentialité et sécurité → Microphone et activez « Autoriser les applications de bureau à accéder au microphone ».
