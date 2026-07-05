import { describe, it, expect } from "vitest";
import {
  createUserValidation,
  updateUserValidation,
} from "../../../src/validators/userValidators.js";
import { runValidation, fakeReq } from "../helpers/runValidation.js";

describe("createUserValidation", () => {
  it("acepta un usuario válido", async () => {
    const result = await runValidation(
      createUserValidation,
      fakeReq({ body: { name: "Ada", email: "ada@example.com", password: "secret1" } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza un email con formato inválido", async () => {
    const result = await runValidation(
      createUserValidation,
      fakeReq({ body: { name: "Ada", email: "no-es-un-email", password: "secret1" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza una contraseña de menos de 6 caracteres", async () => {
    const result = await runValidation(
      createUserValidation,
      fakeReq({ body: { name: "Ada", email: "ada@example.com", password: "123" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza un rol fuera del enum", async () => {
    const result = await runValidation(
      createUserValidation,
      fakeReq({ body: { name: "Ada", email: "ada@example.com", password: "secret1", role: "superadmin" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });
});

describe("updateUserValidation", () => {
  it("acepta un body vacío (todos los campos son opcionales)", async () => {
    const result = await runValidation(updateUserValidation, fakeReq({ body: {} }));
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza un email inválido cuando se envía", async () => {
    const result = await runValidation(updateUserValidation, fakeReq({ body: { email: "invalido" } }));
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza un rol fuera del enum cuando se envía", async () => {
    const result = await runValidation(updateUserValidation, fakeReq({ body: { role: "root" } }));
    expect(result.isEmpty()).toBe(false);
  });

  // NUEVO: junto con el fix del bug 500 de updateUser, updateUserValidation
  // ahora valida `password` (opcional, mínimo 6 caracteres) igual que createUserValidation.
  it("acepta un password válido cuando se envía", async () => {
    const result = await runValidation(updateUserValidation, fakeReq({ body: { password: "secret1" } }));
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza un password de menos de 6 caracteres cuando se envía", async () => {
    const result = await runValidation(updateUserValidation, fakeReq({ body: { password: "123" } }));
    expect(result.isEmpty()).toBe(false);
  });
});
