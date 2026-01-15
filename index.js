const express = require("express");
const { exec } = require("child_process");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "RetentionX FFmpeg Worker Running" });
});

app.post("/test-ffmpeg", (req, res) => {
  exec("ffmpeg -version", (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ ffmpeg: stdout });
  });
});

app.listen(3000, () => {
  console.log("FFmpeg worker running on port 3000");
});
