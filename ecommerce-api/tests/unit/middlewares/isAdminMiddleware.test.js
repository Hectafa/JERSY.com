import { describe, it, expect, vi } from "vitest";
import isAdmin from "../../../src/middlewares/isAdminMiddleware.js";

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("isAdminMiddleware", () => {
  it("responde 401 si no hay usuario autenticado", () => {
    const req = {};
    const res = buildRes();
    const next = vi.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 si el usuario no tiene rol admin", () => {
    const req = { user: { role: "customer" } };
    const res = buildRes();
    const next = vi.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("llama a next() si el usuario es admin", () => {
    const req = { user: { role: "admin" } };
    const res = buildRes();
    const next = vi.fn();

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
