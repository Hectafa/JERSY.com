import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errorHandler = (err, req, res, next) => {
  const logFilePath = path.join(__dirname, "../../logs/error.log");
  const dateTime = new Date();
  const logMessage = `${dateTime.toISOString()} | ${req.method} | ${req.url} ${err.message} | ${err.stack}\n`;
  const logDir = path.dirname(logFilePath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFile(logFilePath, logMessage, (fsErr) => {
    if (fsErr) {
      console.error("Failed to write into log file: ", fsErr);
    }
  });

  if (!res.headerSent) {
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

export default errorHandler;
