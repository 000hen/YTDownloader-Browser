window.addEventListener('load', e => {
    console.log('[YTDownload-Browser] Web script loaded.');

    var nofList = [];

    function makenof(message, cleanUp = true) {
        function makeid() {
            return Math.floor(Math.random() * 100000000);
        }
        if (!document.querySelector("#dwn-info")) {
            var doc = document.createElement("div");
            doc.id = "dwn-info";
            doc.style.display = "flex";
            doc.style.alignItems = "center";
            doc.style.flexDirection = "column";
            doc.style.flexWrap = "nowrap";
            doc.style.width = "300px";
            doc.style.maxHeight = "calc(100% - 60px)";
            doc.style.position = "fixed";
            doc.style.margin = "10px";
            doc.style.overflow = "auto";
            doc.style.zIndex = 300;
            doc.style.bottom = "15px";
            doc.style.right = "15px";

            document.body.appendChild(doc);
        }
        try {
            function createDoc(fontColor) {
                var doc = document.createElement("div");
                doc.style.display = "flex";
                doc.style.alignItems = "center";
                doc.style.alignContent = "center";
                doc.style.justifyContent = "center";
                doc.style.width = "calc(100% - 40px)";
                doc.style.backgroundColor = "#fff";
                doc.style.color = fontColor;
                doc.style.zIndex = 1000;
                doc.style.borderRadius = "10px";
                doc.style.boxShadow = "0px 0px 10px #000";
                doc.style.padding = "10px";
                doc.style.margin = "10px";
                doc.style.fontSize = "15px";

                return doc;
            }

            const ID = makeid();
            var doc;

            switch (message.type) {
                case "info":
                    doc = createDoc("#914100");
                    doc.innerHTML = message.message;
                    doc.setAttribute("data-msgid", ID);
                    document.querySelector("#dwn-info").appendChild(doc);
                    break;

                case "success":
                    doc = createDoc("#00b300");
                    doc.innerHTML = message.message;
                    doc.setAttribute("data-msgid", ID);
                    document.querySelector("#dwn-info").appendChild(doc);
                    break;

                case "error":
                    doc = createDoc("#ff0000");
                    doc.innerHTML = message.message;
                    doc.setAttribute("data-msgid", ID);
                    document.querySelector("#dwn-info").appendChild(doc);
                    break;

            }

            if (cleanUp) setTimeout(() => doc.remove(), 5000);

            return ID;
        } catch (e) {
            console.log(e);
        }
    }

    function cleannof(id) {
        var doc = document.querySelector("#dwn-info [data-msgid='" + id + "']");
        if (!doc) return;
        doc.remove();
    }

    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.message === "download") {
            const ID = request.id;
            if (location.hostname === "music.youtube.com") {
                var url = new URL(location.href);
                switch (url.pathname) {
                    case "/watch":
                        var type = "music";
                        if (request.type === "video") type = "video";
                        sendMessage([location.href], type);
                        break;
                    
                    case "/playlist":
                        var t = location.href;
                        if (url.searchParams.get("list") === "LM") {
                            var y = [];
                            
                            var doc = document.createElement("div");
                            doc.style.display = "flex";
                            doc.style.alignItems = "center";
                            doc.style.alignContent = "center";
                            doc.style.justifyContent = "center";
                            doc.style.width = "100vw";
                            doc.style.height = "100vh";
                            doc.style.position = "fixed";
                            doc.style.backgroundColor = "#000000e6";
                            doc.style.color = "#fff";
                            doc.style.zIndex = 300;
                            doc.style.top = 0;
                            doc.style.left = 0;

                            doc.innerHTML = "<h1 style='font-size: 60px;'>Getting The Favorite Songs...</h1>";

                            var l = document.body.appendChild(doc);
                            function p() {
                                return new Promise((reslove, reject) => {
                                    var body = document.body,
                                        html = document.documentElement;
                                    var height = Math.max(body.scrollHeight, body.offsetHeight,
                                        html.clientHeight, html.scrollHeight, html.offsetHeight);
                                    
                                    window.scrollTo({
                                        left: 0,
                                        top: height
                                    });
                                    
                                    if (document.getElementById("continuations").offsetHeight !== 0) {
                                        setTimeout(async () => reslove(await p()), 1200);
                                    } else if (document.getElementById("continuations").offsetHeight === 0) {
                                        document.querySelectorAll("ytmusic-responsive-list-item-renderer").forEach(e => {
                                            y.push(e.getElementsByClassName("yt-simple-endpoint style-scope yt-formatted-string")[0].href)
                                        });
                                        t = y;
                                        l.remove();
                                        reslove(true);
                                    }
                                });
                            }
                            await p();
                        }
                        var type = "music";
                        if (request.type === "video") type = "video"
                        sendMessage(t, type);
                        break;
                }
            }

            if (location.hostname === "www.youtube.com") {
                var url = new URL(location.href);
                switch (url.pathname) {
                    case "/watch":
                        var type = "video";
                        if (request.type === "audio") type = "music"
                        sendMessage([location.href], type)
                        break;

                    case "/playlist":
                        var type = "video";
                        if (request.type === "audio") type = "music"
                        sendMessage(location.href, type)
                        break;
                }
            }
        } else {
            if (document.visibilityState === "hidden") return sendResponse(true);
            if (request.id) {
                // console.log(request);
                if (nofList.findIndex(e => e.dwnID === request.id) !== -1) {
                    cleannof(nofList.find(e => e.dwnID === request.id).nfID);
                    nofList.splice(nofList.findIndex(e => e.dwnID === request.id), 1);
                }
                var autoClose = false;
                if (request.message.startsWith("Downloaded")) autoClose = true;

                nofList.push({ nfID: makenof(request, autoClose), dwnID: request.id });
            } else {
                makenof(request);
            }
        }
        sendResponse(true);
    });

    var dfu, d;

    function hhj() {
        if (location.hostname === "www.youtube.com") {
            var url = new URL(location.href);
            switch (url.pathname) {
                case "/watch":
                    d = document.createElement("button")
                    d.setAttribute("draggable", false);
                    d.classList.add("playerButton", "ytp-button");
                    d.title = "Download";
                    d.setAttribute("aria-label", "Download");
                    d.style.display = "unset";
                    d.innerHTML = `<svg class="svg-icon" viewBox="0 0 20 20">
                        <path fill="#fff" style="transform: scale(0.75) translate(calc(50% - 6.5px), calc(50% - 7.5px));" d="M15.608,6.262h-2.338v0.935h2.338c0.516,0,0.934,0.418,0.934,0.935v8.879c0,0.517-0.418,0.935-0.934,0.935H4.392c-0.516,0-0.935-0.418-0.935-0.935V8.131c0-0.516,0.419-0.935,0.935-0.935h2.336V6.262H4.392c-1.032,0-1.869,0.837-1.869,1.869v8.879c0,1.031,0.837,1.869,1.869,1.869h11.216c1.031,0,1.869-0.838,1.869-1.869V8.131C17.478,7.099,16.64,6.262,15.608,6.262z M9.513,11.973c0.017,0.082,0.047,0.162,0.109,0.226c0.104,0.106,0.243,0.143,0.378,0.126c0.135,0.017,0.274-0.02,0.377-0.126c0.064-0.065,0.097-0.147,0.115-0.231l1.708-1.751c0.178-0.183,0.178-0.479,0-0.662c-0.178-0.182-0.467-0.182-0.645,0l-1.101,1.129V1.588c0-0.258-0.204-0.467-0.456-0.467c-0.252,0-0.456,0.209-0.456,0.467v9.094L8.443,9.553c-0.178-0.182-0.467-0.182-0.645,0c-0.178,0.184-0.178,0.479,0,0.662L9.513,11.973z"></path>
                    </svg>`;
                    var h = document.getElementsByClassName("ytp-right-controls")[0];
                    h.insertBefore(d, h.firstChild);
                    d.addEventListener("click", event => {
                        event.preventDefault();
                        makenof({
                            message: "Download the video!",
                            type: "info"
                        });
                        chrome.runtime.sendMessage({
                            message: "download"
                        });
                    });
                    break;
                
                case "/playlist":
                    d = document.createElement("button")
                    d.setAttribute("draggable", false);
                    d.classList.add("playerButton", "ytp-button");
                    d.title = "Download";
                    d.setAttribute("aria-label", "Download");
                    d.style.display = "inline-block";
                    d.style.width = "40px";
                    d.style.height = "40px";
                    d.innerHTML = `<svg class="svg-icon" viewBox="0 0 20 20" style="width: 24px; height: 24px; transform: translate(50%, 2px);">
                        <path fill="#fff" d="M15.608,6.262h-2.338v0.935h2.338c0.516,0,0.934,0.418,0.934,0.935v8.879c0,0.517-0.418,0.935-0.934,0.935H4.392c-0.516,0-0.935-0.418-0.935-0.935V8.131c0-0.516,0.419-0.935,0.935-0.935h2.336V6.262H4.392c-1.032,0-1.869,0.837-1.869,1.869v8.879c0,1.031,0.837,1.869,1.869,1.869h11.216c1.031,0,1.869-0.838,1.869-1.869V8.131C17.478,7.099,16.64,6.262,15.608,6.262z M9.513,11.973c0.017,0.082,0.047,0.162,0.109,0.226c0.104,0.106,0.243,0.143,0.378,0.126c0.135,0.017,0.274-0.02,0.377-0.126c0.064-0.065,0.097-0.147,0.115-0.231l1.708-1.751c0.178-0.183,0.178-0.479,0-0.662c-0.178-0.182-0.467-0.182-0.645,0l-1.101,1.129V1.588c0-0.258-0.204-0.467-0.456-0.467c-0.252,0-0.456,0.209-0.456,0.467v9.094L8.443,9.553c-0.178-0.182-0.467-0.182-0.645,0c-0.178,0.184-0.178,0.479,0,0.662L9.513,11.973z"></path>
                    </svg>`;
                    var t = document.querySelector("ytd-menu-renderer.style-scope.ytd-playlist-sidebar-primary-info-renderer");
                    t.appendChild(d);
                    d.addEventListener("click", event => {
                        event.preventDefault();
                        makenof({
                            message: "Download the playlist!",
                            type: "info"
                        });
                        chrome.runtime.sendMessage({
                            message: "download"
                        });
                    });
                    break;
                
            }
        }

        if (location.hostname == "music.youtube.com") {
            var url = new URL(location.href);
            switch (url.pathname) {
                case "/watch":
                    d = document.createElement("button")
                    d.setAttribute("draggable", false);
                    d.classList.add("playerButton", "ytp-button");
                    d.title = "Download";
                    d.setAttribute("aria-label", "Download");
                    d.style.display = "inline-block";
                    d.style.width = "40px";
                    d.style.height = "40px";
                    d.innerHTML = `<svg class="svg-icon" viewBox="0 0 20 20" style="width: 24px; height: 24px; transform: translate(8px, 0);">
                        <path fill="#fff" d="M15.608,6.262h-2.338v0.935h2.338c0.516,0,0.934,0.418,0.934,0.935v8.879c0,0.517-0.418,0.935-0.934,0.935H4.392c-0.516,0-0.935-0.418-0.935-0.935V8.131c0-0.516,0.419-0.935,0.935-0.935h2.336V6.262H4.392c-1.032,0-1.869,0.837-1.869,1.869v8.879c0,1.031,0.837,1.869,1.869,1.869h11.216c1.031,0,1.869-0.838,1.869-1.869V8.131C17.478,7.099,16.64,6.262,15.608,6.262z M9.513,11.973c0.017,0.082,0.047,0.162,0.109,0.226c0.104,0.106,0.243,0.143,0.378,0.126c0.135,0.017,0.274-0.02,0.377-0.126c0.064-0.065,0.097-0.147,0.115-0.231l1.708-1.751c0.178-0.183,0.178-0.479,0-0.662c-0.178-0.182-0.467-0.182-0.645,0l-1.101,1.129V1.588c0-0.258-0.204-0.467-0.456-0.467c-0.252,0-0.456,0.209-0.456,0.467v9.094L8.443,9.553c-0.178-0.182-0.467-0.182-0.645,0c-0.178,0.184-0.178,0.479,0,0.662L9.513,11.973z"></path>
                    </svg>`;
                    var t = document.querySelector(".top-row-buttons.style-scope.ytmusic-player");
                    t.insertBefore(d, t.firstChild);
                    d.addEventListener("click", event => {
                        event.preventDefault();
                        makenof({
                            message: "Download the song!",
                            type: "info"
                        });
                        chrome.runtime.sendMessage({
                            message: "download"
                        });
                    });
                    break;
                
                case "/playlist":
                    d = document.createElement("button")
                    d.setAttribute("draggable", false);
                    d.classList.add("playerButton", "ytp-button");
                    d.title = "Download";
                    d.setAttribute("aria-label", "Download");
                    d.style.display = "inline-block";
                    d.style.width = "40px";
                    d.style.height = "40px";
                    d.innerHTML = `<svg class="svg-icon" viewBox="0 0 20 20" style="width: 24px; height: 24px; transform: translate(8px, 0);">
                        <path fill="#fff" d="M15.608,6.262h-2.338v0.935h2.338c0.516,0,0.934,0.418,0.934,0.935v8.879c0,0.517-0.418,0.935-0.934,0.935H4.392c-0.516,0-0.935-0.418-0.935-0.935V8.131c0-0.516,0.419-0.935,0.935-0.935h2.336V6.262H4.392c-1.032,0-1.869,0.837-1.869,1.869v8.879c0,1.031,0.837,1.869,1.869,1.869h11.216c1.031,0,1.869-0.838,1.869-1.869V8.131C17.478,7.099,16.64,6.262,15.608,6.262z M9.513,11.973c0.017,0.082,0.047,0.162,0.109,0.226c0.104,0.106,0.243,0.143,0.378,0.126c0.135,0.017,0.274-0.02,0.377-0.126c0.064-0.065,0.097-0.147,0.115-0.231l1.708-1.751c0.178-0.183,0.178-0.479,0-0.662c-0.178-0.182-0.467-0.182-0.645,0l-1.101,1.129V1.588c0-0.258-0.204-0.467-0.456-0.467c-0.252,0-0.456,0.209-0.456,0.467v9.094L8.443,9.553c-0.178-0.182-0.467-0.182-0.645,0c-0.178,0.184-0.178,0.479,0,0.662L9.513,11.973z"></path>
                    </svg>`;
                    var t = document.querySelector(".detail-page-menu.style-scope.ytmusic-detail-header-renderer");
                    t.appendChild(d);
                    d.addEventListener("click", event => {
                        event.preventDefault();
                        makenof({
                            message: "Download the playlist!",
                            type: "info"
                        });
                        chrome.runtime.sendMessage({
                            message: "download"
                        });
                    });
                    break;
            }
        }
        dfu = location.href;
    }
    try {
        hhj();
    } catch (e) { }

    setInterval(() => {
        var l = location.href;
        if (l !== dfu) {
            dfu = l;
            if (d) d.remove();
            try {
                hhj();
            } catch (e) { }
        }
    }, 500);


    function sendMessage(videos = [], type = "video") {
        try {
            return chrome.runtime.sendMessage({
                videos: videos,
                type: type,
                cookies: document.cookie
            });
        } catch (e) {
            console.log("[YTDownload-Browser] Cannot download video/song.")
        }
    }

    document.addEventListener("visibilitychange", (event) => {
        if (document.visibilityState === "hidden") {
            for (var f of nofList) {
                cleannof(f.nfID);
            }
        }
    });
});