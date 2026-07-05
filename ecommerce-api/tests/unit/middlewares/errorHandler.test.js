import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import errorHandler from "../../../src/middlewares/errorHandler.js";

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    appendFile: vi.fn((path, message, callback) => callback(null)),
  },
}));

const buildRes = (headersSent = false) => {
  const res = { headersSent };
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("responde 500 con un mensaje genérico cuando los headers no fueron enviados", () => {
    const err = new Error("Algo explotó");
    const req = { method: "GET", url: "/api/whatever" };
    const res = buildRes(false);
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: "error", message: "Internal Server Error" });
  });

  it("intenta registrar el error en el log", () => {
    const err = new Error("Algo explotó");
    const req = { method: "POST", url: "/api/orders" };
    const res = buildRes(false);
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(fs.appendFile).toHaveBeenCalledOnce();
    const [, logMessage] = fs.appendFile.mock.calls[0];
    expect(logMessage).toContain("POST");
    expect(logMessage).toContain("/api/orders");
    expect(logMessage).toContain("Algo explotó");
  });

  it("no vuelve a responder si los headers ya fueron enviados", () => {
    const err = new Error("Ya se respondió antes");
    const req = { method: "GET", url: "/api/products" };
    const res = buildRes(true);
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
