

// API key pour OpenAI (à remplacer par la vôtre)
const GEMINI_API_KEY = 'AIzaSyAtMWTEmx-0njal9rbautS0NKHh9j_hgaQ';

let dossIds = [];

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
                "text": `Voici une liste de favoris (avec le titre et l'URL) :\n${formattedBookmarks}\n\nTrie-les en fonction de leur thème et renvoie-moi un json avec les favoris regroupés dans des catégories claires et précises.`
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
}
function moveBookmarksToCategories(sortedCategories, bookmarks) {
    let themeFolderIds = {};

    // For each category, create a folder if necessary and move the bookmarks
    Object.keys(sortedCategories).forEach(categoryName => {
        const bookmarksList = sortedCategories[categoryName];

        // Create a folder for each category if necessary
        chrome.bookmarks.search({ title: categoryName }, (results) => {
            let folderId;
            if (results.length > 0) {
                folderId = results[0].id;
            } else {
                chrome.bookmarks.create({ parentId: folderId, title: categoryName }, (newFolder) => {
                    folderId = newFolder.id;
                    moveBookmarksToFolder(bookmarksList, folderId, bookmarks);
                });
                return;  // Exit this function to wait for the folder creation
            }

            // Move the bookmarks into the folder
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
        // Example call to the function
        cleanupBookmarksBar();
        sendResponse({ status: 'success', message: 'Favoris triés par Gemini' });
    } else if (message.action === 'extractAndDeleteFolders') {
        extractAndDeleteFolders();
        sendResponse({ status: 'success', message: 'Dossiers extraits et supprimés' });
    }
});

// Fonction pour extraire tous les favoris des dossiers et supprimer les dossiers
function extractAndDeleteFolders() {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        let bookmarks = flattenBookmarks(bookmarkTreeNodes);

        // Parcourir tous les dossiers et extraire les favoris
        bookmarkTreeNodes.forEach(node => {
            if (node.children) {
                extractBookmarksFromFolder(node);
            }
        });
    });
}

// Fonction pour extraire les favoris d'un dossier et supprimer le dossier
function extractBookmarksFromFolder(folderNode) {
    if (folderNode.children) {
        folderNode.children.forEach(childNode => {
            if (childNode.url) {
                // Déplacer le favori à la racine
                chrome.bookmarks.move(childNode.id, { parentId: '1' }, () => {
                    console.log(`Favori déplacé à la racine : ${childNode.title}`);
                });
            } else if (childNode.children) {
                // Appel récursif pour les sous-dossiers
                extractBookmarksFromFolder(childNode);
            }
        });

        // Supprimer le dossier une fois les favoris extraits
        chrome.bookmarks.removeTree(folderNode.id, () => {
            console.log(`Dossier supprimé : ${folderNode.title}`);
        });
    }
}

// Function to clean up the bookmarks bar by removing individual bookmarks
function cleanupBookmarksBar() {
    chrome.bookmarks.getChildren('1', (bookmarkNodes) => {
        bookmarkNodes.forEach(node => {
            if (node.url) {
                chrome.bookmarks.remove(node.id, () => {
                    console.log(`Bookmark removed: ${node.title}`);
                });
            }
        });
    });

    console.log(dossIds);

    // remplir la barre de favoris avec des favoris qui ont pour parentId pa 1
   dossIds.forEach(dossId => {
        chrome.bookmarks.move(dossId, { parentId: '1' }, () => {
            console.log(`Dossier déplacé à la racine : ${dossId}`);
        });
    });
}


