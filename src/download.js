function dall(ref, title, filename, ytCookies) {
    return new Promise((resolve, reject) => {
        const uuid = require('uuid');
        const ytdl = require('ytdl-core');
        // Global constants

        var videoID = uuid.v4();
        var audioID = uuid.v4();

        var vddone = false;
        var addone = false;

        // Get audio and video stream going
        const audio = ytdl(ref, {
            filter: 'audioonly',
            quality: 'highestaudio',
            requestOptions: {
                Headers: new Headers({
                    Cookies: ytCookies
                })
            }
        })
        const video = ytdl(ref, {
            filter: 'videoonly',
            quality: 'highestvideo',
            requestOptions: {
                Headers: new Headers({
                    Cookies: ytCookies
                })
            }
        })
        
        var raudio = [];
        var rvideo = [];

        video.on("data", chunk => {
            rvideo.push(chunk);
        });
        audio.on("data", chunk => {
            raudio.push(chunk);
        });

        video.on('end', () => {
            rvideo = Buffer.concat(rvideo);
            vddone = true;
        });

        audio.on('end', () => {
            raudio = Buffer.concat(raudio);
            addone = true;
        });

        var k = setInterval(() => {
            if (vddone && addone) {
                clearInterval(k);
                sff();
            }
        }, 500);

        async function sff() {
            console.log(`\x1b[33mConverting ${title}...\x1b[0m`);
            sendPageMessage(`Converting ${title}...`, "info");
            var res = ffmpeg({
                MEMFS: [
                    {
                        name: `${audioID}`,
                        data: raudio
                    },
                    {
                        name: `${videoID}`,
                        data: rvideo
                    }
                ],
                arguments: ["-hide_banner", "-loglevel", "error", "-i", `${videoID}`, "-i", `${audioID}`, "-map", "0:v?", "-map", "1:a?", "-c:v", "copy", "-shortest", `${filename}.mp4`]
            });
            downloadAsFile(Buffer(res.MEMFS[0].data), `${filename}.mp4`);

            delete res.MEMFS[0];
            delete raudio;
            delete rvideo;

            console.log(`\x1b[32mDownloaded ${title}\x1b[0m`);
            sendPageMessage(`Downloaded ${title}`, "success");

            return resolve(true);
        }
    })
}

exports.dall = dall;