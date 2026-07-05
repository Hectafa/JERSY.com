import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import Address from "../../src/models/Address.js";
import { createUser, authHeader } from "../helpers/fixtures.js";

// NUEVO: no existía ningún test para /api/addresses. Se agrega uno enfocado
// en el fix del campo `name` (antes ausente en el schema de Address y
// descartado en silencio por Mongoose al guardar).
describe("POST /api/addresses", () => {
  it("persiste el campo name (antes se descartaba en silencio)", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", authHeader(token))
      .send({
        name: "Casa",
        address: "Calle Falsa 123",
        city: "CDMX",
        state: "CDMX",
        postalCode: "01000",
        country: "México",
        phone: "5555555555",
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Casa");

    const stored = await Address.findById(res.body._id);
    expect(stored.name).toBe("Casa");
  });
});

describe("GET /api/addresses", () => {
  it("devuelve las direcciones del usuario autenticado, incluyendo name", async () => {
    const { user, token } = await createUser();

    await request(app)
      .post("/api/addresses")
      .set("Authorization", authHeader(token))
      .send({
        name: "Oficina",
        address: "Av. Siempre Viva 456",
        city: "Guadalajara",
        state: "Jalisco",
        postalCode: "44100",
        country: "México",
        phone: "3333333333",
      });

    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.addresses).toHaveLength(1);
    expect(res.body.addresses[0].name).toBe("Oficina");
  });
});
