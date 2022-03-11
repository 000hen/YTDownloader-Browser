function sendToBack(type = null) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        var currTab = tabs[0];
        if (currTab) {
            chrome.tabs.sendMessage(currTab.id, {
                message: 'download',
                type: type
            });
            window.close();
        }
    });
}

document.getElementById("da").addEventListener("click", () => {
    sendToBack();
});

document.getElementById("dm").addEventListener("click", () => {
    sendToBack("audio");
});

document.getElementById("dv").addEventListener("click", () => {
    sendToBack("video");
});

document.getElementById("c").addEventListener("click", () => {
    window.close();
});