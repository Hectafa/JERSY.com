import apiClient from "./apiClient";
import {
  getPaymentMethods,
  getDefaultPaymentMethod,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "./paymentService";

jest.mock("./apiClient");

describe("paymentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getPaymentMethods llama GET /payment-methods/me", async () => {
    apiClient.get.mockResolvedValue({ data: [{ _id: "pm1" }] });

    const result = await getPaymentMethods();

    expect(apiClient.get).toHaveBeenCalledWith("/payment-methods/me");
    expect(result).toEqual([{ _id: "pm1" }]);
  });

  test("getPaymentMethods devuelve [] cuando data es falsy", async () => {
    apiClient.get.mockResolvedValue({ data: null });

    const result = await getPaymentMethods();

    expect(result).toEqual([]);
  });

  test("getDefaultPaymentMethod devuelve el que tiene isDefault=true", async () => {
    apiClient.get.mockResolvedValue({
      data: [{ _id: "pm1", isDefault: false }, { _id: "pm2", isDefault: true }],
    });

    const result = await getDefaultPaymentMethod();

    expect(result).toEqual({ _id: "pm2", isDefault: true });
  });

  test("getDefaultPaymentMethod usa el primero si ninguno es default", async () => {
    apiClient.get.mockResolvedValue({
      data: [{ _id: "pm1", isDefault: false }, { _id: "pm2", isDefault: false }],
    });

    const result = await getDefaultPaymentMethod();

    expect(result).toEqual({ _id: "pm1", isDefault: false });
  });

  test("getDefaultPaymentMethod devuelve null cuando no hay métodos", async () => {
    apiClient.get.mockResolvedValue({ data: [] });

    const result = await getDefaultPaymentMethod();

    expect(result).toBeNull();
  });

  test("createPaymentMethod llama POST /payment-methods", async () => {
    apiClient.post.mockResolvedValue({ data: { _id: "pm1" } });

    await createPaymentMethod({ type: "credit_card", cardNumber: "4111111111111111" });

    expect(apiClient.post).toHaveBeenCalledWith("/payment-methods", {
      type: "credit_card",
      cardNumber: "4111111111111111",
    });
  });

  test("updatePaymentMethod llama PUT /payment-methods/:id", async () => {
    apiClient.put.mockResolvedValue({ data: { _id: "pm1" } });

    await updatePaymentMethod("pm1", { isDefault: true });

    expect(apiClient.put).toHaveBeenCalledWith("/payment-methods/pm1", { isDefault: true });
  });

  test("deletePaymentMethod llama DELETE /payment-methods/:id", async () => {
    apiClient.delete.mockResolvedValue({});

    await deletePaymentMethod("pm1");

    expect(apiClient.delete).toHaveBeenCalledWith("/payment-methods/pm1");
  });
});
