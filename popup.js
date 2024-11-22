document.getElementById('sortBookmarks').addEventListener('click', () => {
    const messageElement = document.getElementById('message');
    messageElement.textContent = ''; // Clear previous messages
    messageElement.innerHTML = '<div class="loader"></div>'; // Show loader
    chrome.runtime.sendMessage({
        action: 'sortBookmarksWithGemini'
    }, (response) => {
        console.log(response);
        messageElement.innerHTML = ''; // Clear loader
        if (response.status === 'success') {
            messageElement.textContent = 'Les favoris ont été triés avec succès par Gemini.';
        } else if (response.status === 'noBookmarksFound') {
            messageElement.textContent = 'Aucun favori trouvé.';
        } else {
            messageElement.textContent = 'Une erreur est survenue lors du tri des favoris.';
        }
    });
});