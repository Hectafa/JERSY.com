import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./middlewares/logger.js";
import routes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
      : "http://localhost:3000",
    credentials: true,
  }),
);


app.use(express.json());
app.use(logger);
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.get("/", (req, res) => {
  res.send("API Ecommerce con MongoDB");
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});

app.use(errorHandler);

export default app;
