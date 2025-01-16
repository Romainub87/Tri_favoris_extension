document.getElementById('sortBookmarks').addEventListener('click', (event) => {
    const button = event.target;
    button.classList.add('click-animation');
    setTimeout(() => {
        button.classList.remove('click-animation');
    }, 200);

    const messageElement = document.getElementById('message');
    messageElement.textContent = ''; // Clear previous messages
    messageElement.innerHTML = '<div class="loader"></div>'; // Show loader
    chrome.runtime.sendMessage({
        action: 'sortBookmarksWithGemini'
    }, (response) => {
        messageElement.innerHTML = ''; // Clear loader
        if (response.status === 'success') {
            messageElement.textContent = response.message;
        } else if (response.status === 'noBookmarksFound') {
            messageElement.textContent = 'Aucun favori trouvé.';
        } else {
            messageElement.textContent = 'Une erreur est survenue lors du tri des favoris.';
        }
    });
});