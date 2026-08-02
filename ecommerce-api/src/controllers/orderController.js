import Order from "../models/Order.js";
import Product from "../models/Product.js";

const getOrders = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const orders = await Order.find(filter)
      .populate("user")
      .populate("products.productId")
      .populate("address")
      .populate("paymentMethod")
      .sort({ createdAt: -1});
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

// NUEVO (fix): createOrder no descontaba stock en absoluto, así que dos
// usuarios podían pedir más unidades de las que existían (ej. 2 + 2 CH con
// solo 3 en stock). findOneAndUpdate con la condición de stock suficiente
// en el filtro es atómico a nivel de documento en MongoDB: si dos requests
// llegan casi al mismo tiempo, el segundo ve el stock ya descontado por el
// primero y falla la condición, sin importar el orden de llegada.
async function reserveStock(items) {
  const reserved = [];
  for (const item of items) {
    const filter = { _id: item.productId, stock: { $gte: item.quantity } };
    const update = { $inc: { stock: -item.quantity } };
    if (item.size) {
      // $elemMatch es necesario: dos condiciones sueltas ("sizes.size" y
      // "sizes.stock" por separado) pueden cumplirse con DOS elementos
      // distintos del array (ej. talla CH con poco stock + talla M con
      // suficiente), dejando pasar un pedido que en realidad no cabe en la
      // talla pedida. $elemMatch obliga a que ambas condiciones se cumplan
      // en el mismo elemento del array.
      filter.sizes = { $elemMatch: { size: item.size, stock: { $gte: item.quantity } } };
      update.$inc["sizes.$.stock"] = -item.quantity;
    }

    const updated = await Product.findOneAndUpdate(filter, update);
    if (!updated) {
      await releaseStock(reserved);
      const sizeLabel = item.size ? ` (talla ${item.size})` : "";
      return {
        ok: false,
        message: `Stock insuficiente para el producto ${item.productId}${sizeLabel}`,
      };
    }
    reserved.push(item);
  }
  return { ok: true };
}

// Revierte una reserva parcial: se usa si un ítem falla a medio camino (para
// no dejar descontados los ítems anteriores de la misma orden fallida) o si
// Order.create() falla después de haber reservado el stock.
async function releaseStock(items) {
  for (const item of items) {
    if (item.size) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity, "sizes.$[s].stock": item.quantity } },
        { arrayFilters: [{ "s.size": item.size }] },
      );
    } else {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
      );
    }
  }
}

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
        size: item.size ?? null,
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
          item.quantity === b[i].quantity &&
          (item.size || null) === (b[i].size || null),
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

    // NUEVO (fix): reserva (descuenta) el stock real antes de crear la
    // orden. Si no hay suficiente stock para algún ítem, no se crea la
    // orden y se libera lo ya reservado de los ítems anteriores.
    const stockReservation = await reserveStock(normalizedProducts);
    if (!stockReservation.ok) {
      return res.status(400).json({ message: stockReservation.message });
    }

    let newOrder;
    try {
      newOrder = await Order.create({
        user,
        products: normalizedProducts,
        address,
        paymentMethod,
        totalPrice: computedTotal,
        shippingCost,
        tax: computedTax,
      });
    } catch (error) {
      await releaseStock(normalizedProducts);
      throw error;
    }

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

// NUEVO: el admin puede borrar únicamente pedidos ya cerrados (entregados o
// cancelados) — un pedido pending/processing/shipped todavía representa
// stock reservado y trabajo en curso, no debe poder desaparecer del sistema.
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: "Only delivered or cancelled orders can be deleted",
      });
    }

    await Order.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getOrders,
  getOrderById,
  getOrdersByUser,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
