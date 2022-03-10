function dall(ref, title, filename, ffmpeg) {
    return new Promise((resolve, reject) => {
        const uuid = require('uuid');
        const ytdl = require('ytdl-core');
        // Global constants
        const tracker = {
            start: Date.now(),
            audio: {
                downloaded: 0,
                total: Infinity
            },
            video: {
                downloaded: 0,
                total: Infinity
            },
        };

        var videoID = uuid.v4();
        var audioID = uuid.v4();

        var vddone = false;
        var addone = false;

        // Get audio and video stream going
        const audio = ytdl(ref, {
            filter: 'audioonly',
            quality: 'highestaudio'
        })
            .on('progress', (_, downloaded, total) => {
                tracker.audio = {
                    downloaded,
                    total
                };
            });
        const video = ytdl(ref, {
            filter: 'videoonly',
            quality: 'highestvideo'
        })
            .on('progress', (_, downloaded, total) => {
                tracker.video = {
                    downloaded,
                    total
                };
            });
        
        var raudio = [];
        var rvideo = [];

        video.on("data", chunk => {
            rvideo.push(chunk);
        });
        audio.on("data", chunk => {
            raudio.push(chunk);
        });

        video.on('end', () => {
            var buffer = Buffer.concat(rvideo);
            ffmpeg.FS('writeFile', `${videoID}`, buffer);
            vddone = true;
        });

        audio.on('end', () => {
            var buffer = Buffer.concat(raudio);
            ffmpeg.FS('writeFile', `${audioID}`, buffer);
            addone = true;
        });

        var k = setInterval(() => {
            if (vddone && addone) {
                clearInterval(k);
                sff();
            }
        }, 500);

        async function sff() {
            console.log(`\x1b[33mStart making video and audio to "${title}"\x1b[0m`);
            sendPageMessage(`Start making video and audio to "${title}"`, "info");

            function r() {
                return new Promise(async (resolve, reject) => {
                    try {
                        await ffmpeg.run("-i", `${videoID}`, "-i", `${audioID}`, "-map", "0:v?", "-map", "1:a?", "-c:v", "copy", "-shortest", `${videoID}.mp4`);
                        downloadAsFile(ffmpeg.FS("readFile", `${videoID}.mp4`), filename);
                        resolve();
                    } catch (err) {
                        setTimeout(async () => resolve(await r()), 1000);
                    };
                });   
            }
            await r();

            console.log(`\x1b[32mDownloaded ${title}\x1b[0m`);
            sendPageMessage(`Downloaded ${title}`, "success");

            resolve(true);
        }
    })
}

exports.dall = dall;