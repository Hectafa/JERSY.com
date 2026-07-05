import apiClient from "./apiClient";
import { createOrder, getOrderById } from "./orderService";

jest.mock("./apiClient");

describe("orderService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("createOrder llama POST /orders con el payload dado", async () => {
    apiClient.post.mockResolvedValue({ data: { _id: "order-1", status: "pending" } });

    const payload = {
      user: "u1",
      products: [{ productId: "p1", quantity: 2, price: 100 }],
      address: "a1",
      paymentMethod: "pm1",
      totalPrice: 200,
      shippingCost: 0,
    };

    const result = await createOrder(payload);

    expect(apiClient.post).toHaveBeenCalledWith("/orders", payload);
    expect(result).toEqual({ _id: "order-1", status: "pending" });
  });

  test("getOrderById llama GET /orders/:id", async () => {
    apiClient.get.mockResolvedValue({ data: { _id: "order-1" } });

    const result = await getOrderById("order-1");

    expect(apiClient.get).toHaveBeenCalledWith("/orders/order-1");
    expect(result).toEqual({ _id: "order-1" });
  });

  test("propaga el error clasificado si el backend rechaza la orden", async () => {
    apiClient.post.mockRejectedValue({ kind: "VALIDATION", fields: [] });

    await expect(createOrder({})).rejects.toEqual({ kind: "VALIDATION", fields: [] });
  });
});
