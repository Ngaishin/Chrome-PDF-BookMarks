document.getElementById("addBookmark").addEventListener("click", addManualBookmark);
document.getElementById("viewBookmarks").addEventListener("click", viewBookmarks);
document.getElementById("deleteAllBookmarks").addEventListener("click", deleteAllBookmarks);

// Display current PDF name
displayCurrentPDF();

async function displayCurrentPDF() {
    const tab = await getActiveTab();
    const fileName = extractFileName(tab.url);
    document.getElementById("pdfName").innerText = fileName || "Unknown PDF";
}

async function addManualBookmark() {
    const tab = await getActiveTab();
    if (!isPDF(tab.url)) {
        setStatus("This is not a PDF file.");
        return;
    }

    const pageInput = document.getElementById("manualPage");
    const manualPage = parseInt(pageInput.value, 10);
    if (isNaN(manualPage) || manualPage <= 0) {
        setStatus("Please enter a valid page number.");
        return;
    }

    const bookmarks = await getBookmarks(tab.url);
    const currentDate = new Date().toLocaleString(); // Get current date and time
    const newBookmark = { page: manualPage, date: currentDate };

    if (!bookmarks.some(b => b.page === manualPage)) {
        bookmarks.push(newBookmark);
        bookmarks.sort((a, b) => a.page - b.page);
        await saveBookmarks(tab.url, bookmarks);
        setStatus(`Manual bookmark added for Page ${manualPage}.`);
    } else {
        setStatus(`Bookmark for Page ${manualPage} already exists.`);
    }
}

async function viewBookmarks() {
    const tab = await getActiveTab();
    if (!isPDF(tab.url)) {
        setStatus("This is not a PDF file.");
        return;
    }

    const bookmarks = await getBookmarks(tab.url);
    const bookmarksList = document.getElementById("bookmarksList");
    bookmarksList.innerHTML = ""; // Clear previous list

    if (bookmarks.length === 0) {
        setStatus("No bookmarks found for this PDF.");
        return;
    }

    bookmarks.forEach((bookmark, index) => {
        const listItem = document.createElement("li");

        const bookmarkInfo = document.createElement("div");
        bookmarkInfo.className = "bookmark-info";

        const pageNumber = document.createElement("span");
        pageNumber.className = "page-number";
        pageNumber.textContent = `Page ${bookmark.page}`;

        const timestamp = document.createElement("span");
        timestamp.className = "timestamp";
        timestamp.textContent = `(${bookmark.date})`;

        bookmarkInfo.appendChild(pageNumber);
        bookmarkInfo.appendChild(timestamp);
        listItem.appendChild(bookmarkInfo);

        // Add "Delete" button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => {
            bookmarks.splice(index, 1); // Remove the selected bookmark
            await saveBookmarks(tab.url, bookmarks);
            viewBookmarks(); // Refresh the list
            setStatus(`Deleted bookmark for Page ${bookmark.page}.`);
        });
        listItem.appendChild(deleteButton);

        bookmarksList.appendChild(listItem);
    });
}

async function deleteAllBookmarks() {
    const tab = await getActiveTab();
    if (!isPDF(tab.url)) {
        setStatus("This is not a PDF file.");
        return;
    }

    await saveBookmarks(tab.url, []);
    setStatus("All bookmarks deleted.");
    viewBookmarks(); // Refresh the list
}

function setStatus(message) {
    document.getElementById("status").textContent = message;
}

function getActiveTab() {
    return new Promise(resolve => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            resolve(tab);
        });
    });
}

function extractFileName(url) {
    const fileNameMatch = url.match(/([^\/]+)$/);
    return fileNameMatch ? fileNameMatch[1] : null;
}

function isPDF(url) {
    return url && url.endsWith(".pdf");
}

async function getBookmarks(pdfUrl) {
    const bookmarks = await chrome.storage.local.get(pdfUrl);
    return bookmarks[pdfUrl] || [];
}

async function saveBookmarks(pdfUrl, bookmarks) {
    const data = {};
    data[pdfUrl] = bookmarks;
    await chrome.storage.local.set(data);
}
