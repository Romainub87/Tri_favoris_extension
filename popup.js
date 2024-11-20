document.getElementById('sortBookmarks').addEventListener('click', () => {
    // Envoie un message au background.js pour trier les favoris
    chrome.runtime.sendMessage({
        action: 'sortBookmarksWithGemini'
    }, (response) => {
        // Affiche un message de confirmation ou d'erreur en fonction de la réponse
        if (response.status === 'success') {
            console.log('Les favoris ont été triés avec succès par Gemini.');
        } else {
            console.log('Une erreur est survenue lors du tri des favoris.');
        }
    });
});

document.getElementById('extractAndDeleteFolders').addEventListener('click', () => {
    // Envoie un message au background.js pour extraire et supprimer les dossiers
    chrome.runtime.sendMessage({
        action: 'extractAndDeleteFolders'
    }, (response) => {
        // Affiche un message de confirmation ou d'erreur en fonction de la réponse
        if (response.status === 'success') {
            console.log('Les dossiers ont été extraits et supprimés avec succès.');
        } else {
            console.log('Une erreur est survenue lors de l\'extraction et de la suppression des dossiers.');
        }
    });
});
