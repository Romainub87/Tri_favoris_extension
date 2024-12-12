# Extension de Tri des Favoris

Cette extension permet de trier vos favoris par thème en utilisant l'API Gemini.

## Installation

1. Clonez ce dépôt ou téléchargez les fichiers.
2. Ouvrez Google Chrome et allez dans `chrome://extensions/`.
3. Activez le `Mode développeur` en haut à droite.
4. Cliquez sur `Charger l'extension non empaquetée` et sélectionnez le dossier contenant les fichiers de l'extension.

## Utilisation

1. Cliquez sur l'icône de l'extension dans la barre d'outils de Chrome.
2. Une fenêtre popup s'ouvrira avec un bouton `Trier les Favoris`.
3. Cliquez sur le bouton `Trier les Favoris`.
4. L'extension récupérera vos favoris, les enverra à l'API Gemini pour les trier par thème, puis les réorganisera dans des dossiers appropriés.

## Configuration

- Remplacez `votre clé gemini` par votre propre clé API Gemini dans le fichier `background.js`.

## Dépendances

- Cette extension utilise l'API `chrome.bookmarks` pour accéder et manipuler les favoris.
- L'API Gemini est utilisée pour trier les favoris par thème.

## Développement

- Le code source de l'extension est principalement écrit en JavaScript.
- Les styles sont définis dans le fichier `styles.css`.
- L'interface utilisateur de la popup est définie dans le fichier `popup.html`.