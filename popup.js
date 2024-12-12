document.getElementById('sortBookmarks').addEventListener('click', () => {
    const messageElement = document.getElementById('message');
    messageElement.textContent = '';
    messageElement.innerHTML = '<div class="loader"></div>';
    chrome.runtime.sendMessage({
        action: 'sortBookmarksWithGemini'
    }, (response) => {
        messageElement.innerHTML = '';
        if (response.status === 'success') {
            messageElement.textContent = 'Les favoris ont été triés avec succès par Gemini.';
        } else if (response.status === 'noBookmarksFound') {
            messageElement.textContent = 'Aucun favori trouvé.';
        } else {
            messageElement.textContent = 'Une erreur est survenue lors du tri des favoris.';
        }
    });
});