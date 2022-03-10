const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const uuid = require('uuid');
const {
    createFFmpeg,
    fetchFile
} = require('@ffmpeg/ffmpeg');
const ffmpeg = createFFmpeg({
    log: false
});
const fs = require('browserify-fs');
const downloadProgessLimit = 10;

const downloadAsFile = global.downloadAsFile = (blob, filename) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([blob]));
    link.download = filename;
    link.click();
    link.remove();

    return;
}

const sendPageMessage = global.sendPageMessage = (message, type) => {
    try {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                message: message,
                type: type
            });
        });
    } catch (e) { }
}

async function sendToServer(data) {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();
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
            var toFilename = string => string.replace(/\n/g, " ").replace(/[<>:"/\\|?*\x00-\x1F]| +$/g, "").replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/, x => x + "_");
            console.log(`\x1b[33mDownloading ${title}, By ${author}...\x1b[0m`);
            sendPageMessage(`Downloading ${title}, By ${author}...`, "info");
            if (unjson.type === "video") {
                var a = require("./download.js");
                resolve(await a.dall(url, title, `${toFilename(title)}.mp4`, ffmpeg))
            } else {
                var id = uuid.v4();
                // // var file = fs.createWriteStream(`songs/${toFilename(title)}.mp3`);
                var file = []; 
                
                var stream = ytdl(url, {
                    filter: "audioonly"
                });

                stream.on("data", chunk => {
                    file.push(chunk);
                })

                stream.on('end', async () => {
                    var buffer = Buffer.concat(file);
                    console.log(`\x1b[33mConverting ${title} from WebM to MP3...\x1b[0m`);
                    sendPageMessage(`Converting ${title} from WebM to MP3...`, "info");
                    // downloadAsFile(buffer, "test")
                    ffmpeg.FS('writeFile', `${id}`, buffer);

                    function r() {
                        return new Promise(async (resolve, reject) => {
                            try {
                                await ffmpeg.run('-i', `${id}`, `${id}.mp3`);
                                downloadAsFile(ffmpeg.FS("readFile", `${id}.mp3`), `${toFilename(title)}.mp3`);
                                resolve();
                            } catch (err) {
                                r();
                            };
                        });
                    }
                    await r();

                    console.log(`\x1b[32mDownloaded ${title}\x1b[0m`);
                    sendPageMessage(`Downloaded ${title}`, "success");
                    resolve(true);
                });
                stream.on('error', err => {
                    file.end();
                    fs.unlink(`${toFilename(title)}.mp3`);
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

    function dwn() {
        var dsl = downloadProgessLimit;
        if (unjson.type === "video") dsl = Math.floor(downloadProgessLimit / 2);
        if (nowdwn < dsl) {
            download(unjson.videos[p]).then(e => {
                nowdwn--;
                done++;
                if (done === unjson.videos.length) {
                    if (errVds.length > 0) {
                        console.log(`\x1b[31mDownloading Failed: ${errVds.length} videos\x1b[0m`);
                        sendPageMessage(`Downloading Failed: ${errVds.length} videos`, "error");
                        for (var video of errVds) {
                            console.log(`\x1b[31mFailed: ${video}\x1b[0m`);
                            sendPageMessage(`Failed: ${video}`, "error");
                        }
                    }
                    console.log(`\x1b[32mDownloaded all file, in this session YouTube-Downloader downloaded ${p} file(s)\x1b[0m`);
                    sendPageMessage(`Downloaded all file, in this session YouTube-Downloader downloaded ${p} file(s)`, "success");
                }
            });
            nowdwn++;
            p++;
        }

        if (p !== unjson.videos.length && done + 1 !== unjson.videos.length) {
            setTimeout(dwn, 500)
        }
    }
    dwn();

    return true;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'download') {
        chrome.tabs.sendMessage(sender.tab.id, {
            message: 'download'
        });
        return;
    }
    sendToServer(request);
});