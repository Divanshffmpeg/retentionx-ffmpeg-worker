import express from "express";
import { exec } from "child_process";

const app = express();
app.use(express.json());

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.json({ status: "RetentionX FFmpeg Worker Running" });
});

/**
 * ANALYZE SILENCE
 * POST /analyze-silence
 * body:
 * {
 *   "videoPath": "/tmp/video.mp4",
 *   "level": "low" | "medium" | "high"
 * }
 */
app.post("/analyze-silence", (req, res) => {
  const { videoPath, level } = req.body;

  if (!videoPath || !level) {
    return res.status(400).json({ error: "videoPath and level required" });
  }

  const noiseMap = {
    low: "-30dB",
    medium: "-35dB",
    high: "-40dB"
  };

  const noiseLevel = noiseMap[level];
  if (!noiseLevel) {
    return res.status(400).json({ error: "Invalid level" });
  }

  const command = `ffmpeg -i "${videoPath}" -af silencedetect=noise=${noiseLevel}:d=0.3 -f null -`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("FFmpeg error:", error);
      return res.status(500).json({ error: "FFmpeg failed" });
    }

    const lines = stderr.split("\n");
    let silences = [];
    let start = null;

    for (const line of lines) {
      if (line.includes("silence_start")) {
        start = parseFloat(line.split("silence_start: ")[1]);
      }

      if (line.includes("silence_end") && start !== null) {
        const end = parseFloat(
          line.split("silence_end: ")[1].split(" ")[0]
        );

        silences.push({
          start: Number(start.toFixed(2)),
          end: Number(end.toFixed(2)),
          duration: Number((end - start).toFixed(2)),
          selected: true
        });

        start = null;
      }
    }

    res.json({
      success: true,
      silences
    });
  });
});

app.listen(3000, () => {
  console.log("RetentionX FFmpeg Worker running on port 3000");
});