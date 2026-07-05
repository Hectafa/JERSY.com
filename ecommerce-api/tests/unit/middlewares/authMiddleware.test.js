import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import authMiddleware from "../../../src/middlewares/authMiddleware.js";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test_jwt_secret";
  });

  it("responde 401 cuando no hay header Authorization", () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it("responde 401 cuando el token es inválido o expiró", () => {
    jwt.verify.mockImplementation((token, secret, callback) => callback(new Error("invalid")));
    const req = { headers: { authorization: "Bearer un-token-cualquiera" } };
    const res = buildRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("adjunta req.user y llama a next() cuando el token es válido", () => {
    const decoded = { userId: "abc123", name: "Ada", role: "customer" };
    jwt.verify.mockImplementation((token, secret, callback) => callback(null, decoded));
    const req = { headers: { authorization: "Bearer un-token-valido" } };
    const res = buildRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
