import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.conf.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import logger from "./src/middlewares/logger.js";
import routes from "./src/routes/index.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(logger);
app.use(errorHandler);

connectDB();

app.get("/", (req, res) => {
  res.send("API Ecommerce con MongoDB");
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method, // GET / POST / PUT ...
    url: req.originalUrl, // http://localhost:3000/...
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
