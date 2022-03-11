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
            rvideo = [];
            buffer = null;
            vddone = true;
        });

        audio.on('end', () => {
            var buffer = Buffer.concat(raudio);
            ffmpeg.FS('writeFile', `${audioID}`, buffer);
            raudio = [];
            buffer = null;
            addone = true;
        });

        var k = setInterval(() => {
            if (vddone && addone) {
                clearInterval(k);
                sff();
            }
        }, 500);

        async function sff() {
            waitConverts.push({
                title: title,
                videoID: videoID,
                audioID: audioID
            });

            resolve(true);
        }
    })
}

exports.dall = dall;