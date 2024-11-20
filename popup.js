document.getElementById('sortBookmarks').addEventListener('click', () => {
    // Envoie un message au background.js pour trier les favoris
    chrome.runtime.sendMessage({
        action: 'sortBookmarksWithGemini'
    }, (response) => {
        // Affiche un message de confirmation ou d'erreur en fonction de la réponse
        if (response.status === 'success') {
            alert('Les favoris ont été triés avec succès par Gemini.');
        } else {
            alert('Une erreur est survenue lors du tri des favoris.');
        }
    });
});
