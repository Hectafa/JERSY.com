import Order from "../models/Order.js";
import Product from "../models/Product.js";

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("user")
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // NUEVO (fix): antes esta ruta solo exigía authMiddleware, así que
    // cualquier usuario autenticado podía leer la orden de cualquier otro
    // usuario por ID. Ahora solo el dueño de la orden o un admin pueden verla.
    const isOwner = order.user._id.toString() === req.user.userId;
    const isAdminUser = req.user.role === "admin";
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Unauthorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Misma tasa que ya usaba Checkout.jsx para mostrarle el IVA al usuario
// antes de confirmar — ahora también se recalcula y persiste server-side.
const TAX_RATE = 0.16;

const createOrder = async (req, res, next) => {
  try {
    const { user, products, address, paymentMethod, shippingCost = 0 } =
      req.body;
    // NOTA: `totalPrice` y `products[].price` siguen llegando en req.body por
    // compatibilidad con el payload existente, pero ya no se usan para
    // persistir la orden — ver el recálculo server-side más abajo.

    // NUEVO (fix): antes se guardaba tal cual el totalPrice y el
    // products[].price que mandaba el cliente, sin verificarlos contra el
    // catálogo real. Ahora se buscan los productos reales en la base de
    // datos y se recalculan tanto el precio de cada línea como el total,
    // sobrescribiendo en silencio lo que haya enviado el cliente (decisión
    // confirmada: no se rechaza la orden, se ignora el valor recibido).
    const productIds = products.map((p) => p.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const dbProductsById = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let computedSubtotal = 0;
    const normalizedProducts = [];
    for (const item of products) {
      const dbProduct = dbProductsById.get(item.productId.toString());
      if (!dbProduct) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      computedSubtotal += dbProduct.price * item.quantity;
      normalizedProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        price: dbProduct.price,
      });
    }

    const computedTax = parseFloat((computedSubtotal * TAX_RATE).toFixed(2));
    const computedTotal = computedSubtotal + computedTax + shippingCost;

    // NUEVO (fix): antes no había ninguna prevención de duplicados a nivel
    // servidor (solo se deshabilitaba el botón en el frontend). Ahora se
    // rechaza con 409 si ya existe una orden idéntica (mismo usuario,
    // dirección, método de pago, total calculado y mismos productos/
    // cantidades en el mismo orden) creada en los últimos 60 segundos.
    const DUPLICATE_WINDOW_MS = 60 * 1000;
    const recentCandidates = await Order.find({
      user,
      address,
      paymentMethod,
      totalPrice: computedTotal,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    });

    const sameProducts = (a, b) =>
      a.length === b.length &&
      a.every(
        (item, i) =>
          item.productId.toString() === b[i].productId.toString() &&
          item.quantity === b[i].quantity,
      );

    const duplicate = recentCandidates.find((candidate) =>
      sameProducts(candidate.products, normalizedProducts),
    );

    if (duplicate) {
      return res.status(409).json({
        message: "A duplicate order was just submitted. Please wait a moment before retrying.",
        existingOrderId: duplicate._id,
      });
    }

    const newOrder = await Order.create({
      user,
      products: normalizedProducts,
      address,
      paymentMethod,
      totalPrice: computedTotal,
      shippingCost,
      tax: computedTax,
    });

    await newOrder.populate("user");
    await newOrder.populate("products.productId");

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
};

const getOrdersByUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isOwner = id === req.user.userId;
    const isAdminUser = req.user.role === "admin";
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Unauthorized to view these orders" });
    }

    const orders = await Order.find({ user: id })
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updated = await Order.findByIdAndUpdate(
      id,
      { status, paymentStatus },
      { new: true },
    );

    if (!updated) {
      return res.status(204).json({ message: "Order not found" });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export { getOrders, getOrderById, getOrdersByUser, createOrder, updateOrderStatus };
