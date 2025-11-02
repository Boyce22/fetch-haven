const fs = require("fs")
const path = require("path");
const bunyan = require("bunyan");

const logsDir = path.join(__dirname, "logs");

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logger = bunyan.createLogger({
  name: "image-downloader",
  level: "info",
  streams: [
    { stream: process.stdout, level: "info" },
    {
      type: "rotating-file",
      path: path.join(logsDir, "downloader.log"),
      level: "debug",
      period: "1d",
      count: 3,
    },
  ],
});

module.exports = { logger };
