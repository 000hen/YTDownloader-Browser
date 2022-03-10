document.getElementById("d").addEventListener("click", () => {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        var currTab = tabs[0];
        if (currTab) {
            chrome.tabs.sendMessage(currTab.id, {
                message: 'download'
            });
            window.close();
        }
    });
});

document.getElementById("c").addEventListener("click", () => {
    window.close();
});