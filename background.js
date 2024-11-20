

// API key pour OpenAI (à remplacer par la vôtre)
const GEMINI_API_KEY = 'AIzaSyAtMWTEmx-0njal9rbautS0NKHh9j_hgaQ';

// Fonction pour obtenir les favoris et envoyer à Gemini
function sortBookmarksWithGemini() {
    // Obtenez tous les favoris
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        let bookmarks = flattenBookmarks(bookmarkTreeNodes);

        // Formater les favoris en texte pour envoyer à Gemini
        let formattedBookmarks = bookmarks.map(bookmark => {
            return `${bookmark.title}: ${bookmark.url}`;
        }).join("\n");

        // Construction du contenu à envoyer à Gemini
        let contents = [{
            "parts": [{
                "text": `Voici une liste de favoris (avec le titre et l'URL) :\n${formattedBookmarks}\n\nTrie-les en fonction de leur thème et renvoie-moi un json avec les favoris regroupés dans des catégories claires.`
            }]
        }];

        // Appel à l'API Gemini pour générer le contenu trié
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: contents
            })
        })
            .then(response => response.json())
            .then(data => {
                // Extraire le texte généré par Gemini
                console.log(data);

                const sortedCategories = JSON.parse(data.candidates[0].content.parts[0].text.trim().split("json")[1].trim().split("`")[0].trim());

                // Analyser la réponse et organiser les favoris dans les bons dossiers
                moveBookmarksToCategories(sortedCategories, bookmarks);
            })
            .catch(error => {
                console.error(error);
                alert("Une erreur est survenue lors de l'appel à l'API Gemini.");
            });
    });
}

// Exemple de la façon dont vous utiliseriez cette fonction dans le reste du code
function moveBookmarksToCategories(sortedCategories, bookmarks) {
    let themeFolderIds = {};

    // Pour chaque catégorie, on crée un dossier si nécessaire et on déplace les favoris
    Object.keys(sortedCategories).forEach(categoryName => {
        const bookmarksList = sortedCategories[categoryName];

        // Créer un dossier pour chaque catégorie si nécessaire
        chrome.bookmarks.search({ title: categoryName }, (results) => {
            let folderId;
            if (results.length > 0) {
                folderId = results[0].id;
            } else {
                chrome.bookmarks.create({ title: categoryName }, (newFolder) => {
                    folderId = newFolder.id;
                    moveBookmarksToFolder(bookmarksList, folderId, bookmarks);
                });
                return;  // On sort de cette fonction pour attendre la création du dossier
            }

            // Déplacer les favoris dans le dossier
            moveBookmarksToFolder(bookmarksList, folderId, bookmarks);
        });
    });
}

// Fonction pour déplacer les favoris dans un dossier donné
function moveBookmarksToFolder(bookmarksList, folderId, bookmarks) {
    bookmarksList.forEach(bookmark => {
        let matchingBookmark = bookmarks.find(b => b.url === bookmark.url);
        if (matchingBookmark) {
            chrome.bookmarks.move(matchingBookmark.id, { parentId: folderId }, () => {
                console.log(`Favori déplacé vers le dossier ${folderId}`);
            });
        } else {
            chrome.bookmarks.create({
                parentId: folderId,
                title: bookmark.title,
                url: bookmark.url
            }, (newBookmark) => {
                console.log(`Favori ajouté au dossier ${folderId} : ${newBookmark.title}`);
            });
        }
    });
}


// Fonction utilitaire pour aplatir les favoris
function flattenBookmarks(bookmarkNodes) {
    let flatList = [];
    function flatten(node) {
        if (node.url) {
            flatList.push(node);
        }
        if (node.children) {
            node.children.forEach(flatten);
        }
    }
    bookmarkNodes.forEach(flatten);
    return flatList;
}

// Exemple d'appel de la fonction (au moment où vous voulez trier)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sortBookmarksWithGemini') {
        sortBookmarksWithGemini();
        sendResponse({ status: 'success', message: 'Favoris triés par Gemini' });
    }
});