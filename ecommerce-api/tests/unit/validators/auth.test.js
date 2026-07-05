import { describe, it, expect } from "vitest";
import { registerValidation, loginValidation } from "../../../src/validators/authValidators.js";
import { runValidation, fakeReq } from "../helpers/runValidation.js";

describe("registerValidation", () => {
  it("acepta un registro válido", async () => {
    const result = await runValidation(
      registerValidation,
      fakeReq({ body: { name: "Ada", email: "ada@example.com", password: "secret1" } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza cuando falta el nombre", async () => {
    const result = await runValidation(
      registerValidation,
      fakeReq({ body: { email: "ada@example.com", password: "secret1" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza un email con formato inválido", async () => {
    const result = await runValidation(
      registerValidation,
      fakeReq({ body: { name: "Ada", email: "no-es-un-email", password: "secret1" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza una contraseña de menos de 6 caracteres", async () => {
    const result = await runValidation(
      registerValidation,
      fakeReq({ body: { name: "Ada", email: "ada@example.com", password: "123" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });
});

describe("loginValidation", () => {
  it("acepta un login válido", async () => {
    const result = await runValidation(
      loginValidation,
      fakeReq({ body: { email: "ada@example.com", password: "secret1" } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza un email con formato inválido", async () => {
    const result = await runValidation(
      loginValidation,
      fakeReq({ body: { email: "no-es-un-email", password: "secret1" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza cuando falta el password", async () => {
    const result = await runValidation(loginValidation, fakeReq({ body: { email: "ada@example.com" } }));
    expect(result.isEmpty()).toBe(false);
  });
});
