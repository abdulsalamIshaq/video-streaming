import http from "node:http";
import fs from "node:fs/promises";

const PORT = 3000;
const VIDEO_PATH = process.env.VIDEO_PATH;

const server = http.createServer(async (req, res) => {
  try {
    // bytes range
    const range = req.headers.range || "";

    const videoPath = decodeURIComponent(VIDEO_PATH);

    // Get video bytes sizes
    const videoSize = (await fs.stat(videoPath)).size;

    // 10 powered by 6 equal 1000000bytes = 1mb
    const chunkSize = 10 ** 6;

    // calculate where the video should start and end.
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, videoSize - 1);
    const contentLength = end - start + 1;

    // Necessary response header
    const headers = {
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);

    // Open video file
    const videoFile = await fs.open(videoPath);

    // Create read stream
    const videoReadStream = await videoFile.createReadStream({
      start,
      end,
    });

    // close file when streaming is done
    videoReadStream.on("end", () => {
      videoFile.close();
    });

    // Pipe our video file to response and
    videoReadStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
