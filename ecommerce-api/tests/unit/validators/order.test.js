import { describe, it, expect } from "vitest";
import {
  createOrderValidation,
  updateOrderStatusValidation,
} from "../../../src/validators/orderValidators.js";
import { runValidation, fakeReq } from "../helpers/runValidation.js";

const validId = "64b64f1f1f1f1f1f1f1f1f1f";

const validOrderBody = {
  user: validId,
  products: [{ productId: validId, quantity: 2, price: 100 }],
  address: validId,
  paymentMethod: validId,
  totalPrice: 200,
};

describe("createOrderValidation", () => {
  it("acepta un payload de orden completo y válido", async () => {
    const result = await runValidation(createOrderValidation, fakeReq({ body: validOrderBody }));
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza cuando falta la dirección", async () => {
    const { address, ...withoutAddress } = validOrderBody;
    const result = await runValidation(createOrderValidation, fakeReq({ body: withoutAddress }));
    expect(result.isEmpty()).toBe(false);
    expect(result.array().some((e) => e.path === "address")).toBe(true);
  });

  it("rechaza cuando falta el método de pago", async () => {
    const { paymentMethod, ...withoutPayment } = validOrderBody;
    const result = await runValidation(createOrderValidation, fakeReq({ body: withoutPayment }));
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza cuando totalPrice es negativo", async () => {
    const result = await runValidation(
      createOrderValidation,
      fakeReq({ body: { ...validOrderBody, totalPrice: -1 } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza un producto sin price", async () => {
    const result = await runValidation(
      createOrderValidation,
      fakeReq({ body: { ...validOrderBody, products: [{ productId: validId, quantity: 2 }] } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("acepta shippingCost opcional ausente y lo rechaza si es negativo", async () => {
    const withoutShipping = await runValidation(createOrderValidation, fakeReq({ body: validOrderBody }));
    expect(withoutShipping.isEmpty()).toBe(true);

    const negativeShipping = await runValidation(
      createOrderValidation,
      fakeReq({ body: { ...validOrderBody, shippingCost: -5 } }),
    );
    expect(negativeShipping.isEmpty()).toBe(false);
  });
});

describe("updateOrderStatusValidation", () => {
  it("acepta un estado válido dentro del enum", async () => {
    const result = await runValidation(
      updateOrderStatusValidation,
      fakeReq({ params: { id: validId }, body: { status: "delivered" } }),
    );
    expect(result.isEmpty()).toBe(true);
  });

  it("rechaza un estado fuera del enum", async () => {
    const result = await runValidation(
      updateOrderStatusValidation,
      fakeReq({ params: { id: validId }, body: { status: "en-camino-a-la-luna" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });

  it("rechaza un paymentStatus fuera del enum", async () => {
    const result = await runValidation(
      updateOrderStatusValidation,
      fakeReq({ params: { id: validId }, body: { paymentStatus: "invalid" } }),
    );
    expect(result.isEmpty()).toBe(false);
  });
});
