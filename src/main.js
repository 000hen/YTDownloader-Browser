const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const uuid = require('uuid');
const ffmpeg = global.ffmpeg = require("ffmpeg.js/ffmpeg-mp4");

const downloadProgessLimit = 10;

var toFilename = string => string.replace(/\n/g, " ").replace(/[<>:"/\\|?*\x00-\x1F]| +$/g, "").replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/, x => x + "_");

process.stderr = {
    write: function (data) {
        console.log(data);
    }
}
process.stdout = {
    write: function (data) {
        console.log(data);
    }
}
process.stdin = {
    read: function (data) {
        console.log(data);
    }
}

const downloadAsFile = global.downloadAsFile = (blob, filename) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([blob]));
    link.download = filename;
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 60000);

    return;
}

const sendPageMessage = global.sendPageMessage = (message, type) => {
    try {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            if (!tabs[0]) return;
            chrome.tabs.sendMessage(tabs[0].id, {
                message: message,
                type: type
            });
        });
    } catch (e) { }
}

function getVerNumber(verName) {
    verName = verName.replace("v", "");
    verName = verName.split(".").map(e => Number(e));
    var verNum = 0;
    for (var i = 0; i < verName.length; i++) {
        verNum += verName[2 - i] * Math.pow(100, i);
    }

    return verNum;
}

global.isCheckedUpdate = false;

async function checkUpdate() {
    var t = await fetch("https://api.github.com/repos/000hen/YTDownloader-Browser/releases").then(async e => await e.json());

    var manifestData = chrome.runtime.getManifest();
    var localVerNum = getVerNumber(manifestData.version);

    var remoteVerNum = getVerNumber(t[0].tag_name);

    if (localVerNum < remoteVerNum) {
        chrome.notifications.create(String(Math.floor(Math.random() * 10000)), {
            type: 'basic',
            iconUrl: 'assets/icon/YTDownloader-Browser.png',
            title: 'Found New Release',
            message: `Found new YTDownload-Browser Release.\nVersion: ${t[0].tag_name}`,
            buttons: [{
                title: 'Download latest'
            }],
            priority: 2
        });

        chrome.notifications.onButtonClicked.addListener((callback, buttonIndex) => {
            window.open("https://github.com/000hen/YTDownloader-Browser/releases/tag/v1.0.1");
        });
        sendPageMessage("Found new release", "info");
        global.isCheckedUpdate = true;
    }
}

async function sendToServer(data) {
    checkUpdate();

    var nowdwn = 0;
    var done = 0;
    var unjson = data;
    var errVds = [];
    if (typeof (unjson.videos) === "string") {
        var o = await ytpl(unjson.videos);
        unjson.videos = [];
        o.items.forEach(e => {
            unjson.videos.push(e.shortUrl);
        })
    }

    function download(url) {
        return new Promise(async (resolve, reject) => {
            var info = await ytdl.getBasicInfo(url);
            var title = info.player_response.videoDetails.title;
            var author = info.player_response.videoDetails.author;
            console.log(`\x1b[33mDownloading ${title}, By ${author}...\x1b[0m`);
            sendPageMessage(`Downloading ${title}, By ${author}...`, "info");
            if (unjson.type === "video") {
                var a = require("./download.js");
                resolve(await a.dall(url, title, toFilename(title), unjson.cookies, unjson, errVds))
            } else {
                var id = uuid.v4();
                var file = []; 
                
                var stream = ytdl(url, {
                    filter: "audioonly",
                    requestOptions: {
                        Headers: new Headers({
                            Cookies: unjson.cookies
                        })
                    }
                });

                stream.on("data", chunk => {
                    file.push(chunk);
                })

                stream.on('end', async () => {
                    var buffer = Buffer.concat(file);

                    console.log(`\x1b[33mConverting ${title}...\x1b[0m`);
                    sendPageMessage(`Converting ${title}...`, "info");

                    var res = ffmpeg({
                        MEMFS: [{ name: `${id}`, data: buffer }],
                        arguments: ["-hide_banner", "-loglevel", "error", "-i", `${id}`, `${toFilename(title)}.mp3`]
                    });
                    downloadAsFile(Buffer(res.MEMFS[0].data), `${toFilename(title)}.mp3`);

                    delete res.MEMFS[0];
                    delete buffer;
                    delete file;

                    console.log(`\x1b[32mDownloaded ${title}\x1b[0m`);
                    sendPageMessage(`Downloaded ${title}`, "success");
                    
                    resolve(true);
                });
                stream.on('error', err => {
                    console.log(`\x1b[31mDownload ${title} Failed: ${err}\x1b[0m`, err);
                    sendPageMessage(`Download ${title} Failed: ${err}`, "error");
                    if (errVds.findIndex(e => e === url) === -1) {
                        unjson.videos.push(url);
                    }
                    errVds.push(url);
                    resolve(false);
                });
            }


        });
    }

    var p = 0;

    const sleep = ms => new Promise(res => setTimeout(res, ms))
    async function dwn() {
        var d = true;
        while (d) {
            d = p !== unjson.videos.length && done + 1 !== unjson.videos.length;
            if (nowdwn < downloadProgessLimit) {
                download(unjson.videos[p]).then(e => {
                    nowdwn--;
                    done++;
                    if (done === unjson.videos.length) {
                        console.log(`\x1b[32mDownloaded all file, in this session YouTube-Downloader downloaded ${done - errVds.length} file(s)\x1b[0m`);
                        sendPageMessage(`Downloaded all file, in this session YouTube-Downloader downloaded ${done - errVds.length} file(s)`, "success");
                        if (errVds.length > 0) {
                            console.log(`\x1b[31mDownloading Failed: ${errVds.length} videos\x1b[0m`);
                            sendPageMessage(`Downloading Failed: ${errVds.length} videos`, "error");
                            for (var video of errVds) {
                                console.log(`\x1b[31mFailed: ${video}\x1b[0m`);
                                sendPageMessage(`Failed: ${video}`, "error");
                            }
                        }
                    }
                });
                nowdwn++;
                p++;
            }

            if (!d) break;
            await sleep(500);
        }
        return true;
    }
    await dwn();

    return true;
}

// window.addEventListener("load", () => {
//     global.ffmpeg = createFFmpeg({
//         log: false
//     });
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'download') {
        chrome.tabs.sendMessage(sender.tab.id, {
            message: 'download'
        });
        return;
    }
    sendToServer(request);
});