import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt"; // agregado: para comparar el hash de password tras el fix de updateUser
import app from "../../src/app.js";
import User from "../../src/models/User.js"; // agregado: para leer el password hasheado directo de la BD
import { createAdmin, createUser, authHeader } from "../helpers/fixtures.js";

describe("GET /api/users (admin)", () => {
  it("rechaza a un usuario no-admin", async () => {
    const { token } = await createUser();

    const res = await request(app).get("/api/users").set("Authorization", authHeader(token));

    expect(res.status).toBe(403);
  });

  it("lista usuarios sin exponer el password", async () => {
    const { token } = await createAdmin();
    await createUser();

    const res = await request(app).get("/api/users").set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const user of res.body) {
      expect(user.password).toBeUndefined();
    }
  });
});

describe("PUT /api/users/:id", () => {
  // ANTES: este test se llamaba "[hallazgo/bug] responde 500 siempre..." y
  // esperaba `res.status` = 500, documentando a propósito el bug real de
  // userController.updateUser (referenciaba una variable `password` nunca
  // declarada). Ahora que el controlador fue corregido, se renombró y se
  // actualizó para validar el comportamiento correcto (200 + nombre actualizado).
  it("actualiza el nombre sin necesidad de enviar password", async () => {
    const { token } = await createAdmin();
    const { user: target } = await createUser();

    const res = await request(app)
      .put(`/api/users/${target._id}`)
      .set("Authorization", authHeader(token))
      .send({ name: "Nombre actualizado" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nombre actualizado");
    expect(res.body.password).toBeUndefined();
  });

  // NUEVO: cubre la rama del fix que sí hashea y persiste un password cuando
  // el cliente lo envía explícitamente.
  it("actualiza el password cuando se envía uno nuevo", async () => {
    const { token } = await createAdmin();
    const { user: target } = await createUser({ password: "OldPass123!" });

    const res = await request(app)
      .put(`/api/users/${target._id}`)
      .set("Authorization", authHeader(token))
      .send({ password: "NuevaPass123!" });

    expect(res.status).toBe(200);

    const stored = await User.findById(target._id);
    expect(await bcrypt.compare("NuevaPass123!", stored.password)).toBe(true);
    expect(await bcrypt.compare("OldPass123!", stored.password)).toBe(false);
  });
});
