import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/errorHandler.js";
import logger from "./middlewares/logger.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(logger);

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
