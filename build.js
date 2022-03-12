const cp = require('child_process');
const fs = require('fs');

try {
    fs.existsSync("build") ? null : fs.mkdirSync("build");
    fs.existsSync("build/ffmpeg") ? null : fs.mkdirSync("build/ffmpeg");
    fs.copyFileSync("src/manifest.json", "build/manifest.json");
    fs.copyFileSync("src/popup.html", "build/popup.html");
    fs.copyFileSync("src/popupScript.js", "build/popupScript.js");
    fs.copyFileSync("src/ffmpeg/ffmpeg-core.js", "build/ffmpeg/ffmpeg-core.js");
    fs.copyFileSync("src/ffmpeg/ffmpeg-core.wasm", "build/ffmpeg/ffmpeg-core.wasm");
    fs.copyFileSync("src/ffmpeg/ffmpeg-core.worker.js", "build/ffmpeg/ffmpeg-core.worker.js");
    cp.execSync("browserify src/content.js -o build/content-bundle.js");
    cp.execSync("browserify src/main.js -o build/background-bundle.js");
} catch (err) {
    console.log(err);
    process.exit(1);
}

console.log("\x1b[32mBuild Successful\x1b[0m");
process.exit(0);