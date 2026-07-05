import { beforeAll, afterEach, afterAll } from "vitest";
import { connectTestDB, clearTestDB, closeTestDB } from "./testDb.js";

process.env.JWT_SECRET ||= "test_jwt_secret";
process.env.JWT_REFRESH_TOKEN ||= "test_jwt_refresh_secret";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});
