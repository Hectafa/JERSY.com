import dotenv from "dotenv";
import connectDB from "./src/config/db.conf.js";
import app from "./src/app.js";

dotenv.config({ quiet: true });

const port = process.env.PORT || 3000;

connectDB();

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
