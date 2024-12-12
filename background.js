
// API key pour OpenAI (à remplacer par la vôtre)
const GEMINI_API_KEY = 'votre clé gemini';

let dossIds = [];

// Fonction pour obtenir les favoris et envoyer à Gemini
function sortBookmarksWithGemini() {
    // Obtenez tous les favoris
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        let bookmarks = flattenBookmarks(bookmarkTreeNodes);
        console.log(bookmarkTreeNodes);

        // Formater les favoris en texte pour envoyer à Gemini
        let formattedBookmarks = bookmarks.map(bookmark => {
            return `${bookmark.title}: ${bookmark.url}`;
        }).join("\n");

        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            let bookmarks = flattenBookmarks(bookmarkTreeNodes);
            let favoriteBar = bookmarkTreeNodes[0].children[0].children;

            // Formater les favoris en texte pour envoyer à Gemini
            let formattedBookmarks = bookmarks.map(bookmark => {
                return `${bookmark.title}: ${bookmark.url}`;
            }).join("\n");

            // Formater les dossiers en texte pour envoyer à Gemini
            let formattedFolders = favoriteBar.map(folder => {
                return `${folder.title}`;
            }).join("\n");

            // Construction du contenu à envoyer à Gemini
            let contents = [{
                "parts": [{
                    "text": `Voici une liste de liens favoris (avec le titre et l'URL) :\n${formattedBookmarks}\n\n
                     Voici une liste de dossiers existants :\n${formattedFolders}\n\n
                     Trie-les en fonction de leur thème et réutilise les catégories des dossiers existants si possible pour ranger les nouveaux liens. 
                     Renvoie-moi un json avec les favoris regroupés dans des catégories claires et précises.`
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
                    const sortedCategories = JSON.parse(data.candidates[0].content.parts[0].text.trim().split("json")[1].trim().split("`")[0].trim());
                    // Analyser la réponse et organiser les favoris dans les bons dossiers
                    moveBookmarksToCategories(sortedCategories, bookmarks);
                })
                .catch(error => {
                    console.error(error);
                });
        });
    });
}

function moveBookmarksToCategories(sortedCategories, bookmarks) {
    // Pour chaque catégorie, créer un dossier si nécessaire et déplacer les favoris
    Object.keys(sortedCategories).forEach(categoryName => {
        const bookmarksList = sortedCategories[categoryName];

        // Créer un dossier pour chaque catégorie si nécessaire
        chrome.bookmarks.search({ title: categoryName }, (results) => {
            let folderId;
            console.log(results);
            if (results.length > 0) {
                folderId = results[0].id;
            } else {
                chrome.bookmarks.create({ parentId: folderId, title: categoryName }, (newFolder) => {
                    folderId = newFolder.id;
                    moveBookmarksToFolder(bookmarksList, folderId, bookmarks);
                });
                return;
            }
            // Déplacer les favoris dans le dossier
            moveBookmarksToFolder(bookmarksList, folderId, bookmarks);
        });
    });


}

function moveBookmarksToFolder(bookmarksList, folderId, bookmarks) {
    bookmarksList.forEach(bookmark => {
        let matchingBookmark = bookmarks.find(b => b.url === bookmark.url);
        if (matchingBookmark) {
            chrome.bookmarks.move(matchingBookmark.id, { parentId: folderId }, () => {
                console.log(`Bookmark moved to folder ${folderId}`);
            });
        } else {
            chrome.bookmarks.create({
                parentId: folderId,
                title: bookmark.title,
                url: bookmark.url
            }, (newBookmark) => {
                console.log(`Bookmark added to folder ${folderId}: ${newBookmark.title}`);
            });
        }
    });
    dossIds.push(folderId);

    chrome.bookmarks.get(folderId, (folder) => {
        chrome.bookmarks.move(folderId, { parentId: '1' });
    });
}

function flattenBookmarks(bookmarkNodes) {
    let flatList = [];
    function flatten(node) {
        if (node.url) {
            if (node.parentId === '1') {
                flatList.push(node);
            }
        }
        if (node.children) {
            node.children.forEach(flatten);
        }
    }
    bookmarkNodes.forEach(flatten);
    return flatList;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'sortBookmarksWithGemini') {
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            let bookmarks = flattenBookmarks(bookmarkTreeNodes);
            console.log(bookmarks.length);
            if (bookmarks.length === 0) {
                sendResponse({ status: 'noBookmarksFound', message: 'Aucun favori trouvé.' });
            } else {
                sortBookmarksWithGemini();
                sendResponse({ status: 'success', message: 'Favoris triés par Gemini' });
            }
        });
        return true;
    }
});



