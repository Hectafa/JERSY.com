import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import PaymentMethod from "../../src/models/PaymentMethod.js";
import { createUser, createPaymentMethod, authHeader } from "../helpers/fixtures.js";

describe("POST /api/payment-methods", () => {
  it("rechaza la creación sin token", async () => {
    const res = await request(app)
      .post("/api/payment-methods")
      .send({ type: "credit_card" });

    expect(res.status).toBe(401);
  });

  it("rechaza cuando falta el tipo de pago", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post("/api/payment-methods")
      .set("Authorization", authHeader(token))
      .send({ user: user._id, cardNumber: "4111111111111111" });

    expect(res.status).toBe(422);
  });

  it("crea un método de pago válido", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .post("/api/payment-methods")
      .set("Authorization", authHeader(token))
      .send({
        user: user._id,
        type: "credit_card",
        cardNumber: "4111111111111111",
        cardHolderName: "Test User",
        expiryDate: "12/30",
        cvv: "123",
      });

    expect(res.status).toBe(201);
    const stored = await PaymentMethod.findById(res.body._id);
    expect(stored).not.toBeNull();
    expect(stored.cardNumber).toBe("4111111111111111");
  });
});

describe("PUT /api/payment-methods/:id", () => {
  it("actualiza un método de pago existente", async () => {
    const { user, token } = await createUser();
    const paymentMethod = await createPaymentMethod(user._id, { cardHolderName: "Antes" });

    const res = await request(app)
      .put(`/api/payment-methods/${paymentMethod._id}`)
      .set("Authorization", authHeader(token))
      .send({ cardHolderName: "Después" });

    expect(res.status).toBe(200);
    expect(res.body.cardHolderName).toBe("Después");
  });

  it("devuelve 404 al actualizar un método de pago inexistente", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .put("/api/payment-methods/64b64f1f1f1f1f1f1f1f1f1f")
      .set("Authorization", authHeader(token))
      .send({ cardHolderName: "Nadie" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/payment-methods/:id", () => {
  it("elimina un método de pago existente", async () => {
    const { user, token } = await createUser();
    const paymentMethod = await createPaymentMethod(user._id);

    const res = await request(app)
      .delete(`/api/payment-methods/${paymentMethod._id}`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(204);
    expect(await PaymentMethod.findById(paymentMethod._id)).toBeNull();
  });
});

describe("POST /api/payment-methods/:id/charge", () => {
  it("rechaza el cobro sin token", async () => {
    const { user } = await createUser();
    const paymentMethod = await createPaymentMethod(user._id);

    const res = await request(app)
      .post(`/api/payment-methods/${paymentMethod._id}/charge`)
      .send({ amount: 100 });

    expect(res.status).toBe(401);
  });

  it("aprueba el cobro de una tarjeta normal", async () => {
    const { user, token } = await createUser();
    const paymentMethod = await createPaymentMethod(user._id, {
      cardNumber: "4111111111111111",
    });

    const res = await request(app)
      .post(`/api/payment-methods/${paymentMethod._id}/charge`)
      .set("Authorization", authHeader(token))
      .send({ amount: 232 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
    expect(res.body.transactionId).toBeTruthy();
  });

  it("rechaza el cobro cuando la tarjeta termina en 0000", async () => {
    const { user, token } = await createUser();
    const paymentMethod = await createPaymentMethod(user._id, {
      cardNumber: "4111111110000",
    });

    const res = await request(app)
      .post(`/api/payment-methods/${paymentMethod._id}/charge`)
      .set("Authorization", authHeader(token))
      .send({ amount: 232 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("declined");
  });

  it("rechaza con 403 el cobro de un método de pago que no pertenece al usuario", async () => {
    const owner = await createUser();
    const otherUser = await createUser();
    const paymentMethod = await createPaymentMethod(owner.user._id);

    const res = await request(app)
      .post(`/api/payment-methods/${paymentMethod._id}/charge`)
      .set("Authorization", authHeader(otherUser.token))
      .send({ amount: 100 });

    expect(res.status).toBe(403);
  });

  it("rechaza con 422 cuando el amount no es un número positivo", async () => {
    const { user, token } = await createUser();
    const paymentMethod = await createPaymentMethod(user._id);

    const res = await request(app)
      .post(`/api/payment-methods/${paymentMethod._id}/charge`)
      .set("Authorization", authHeader(token))
      .send({ amount: -5 });

    expect(res.status).toBe(422);
  });
});
