import Product from "../models/Product.js";

// El stock del producto siempre se deriva de las tallas: si no hay stock
// cargado por talla, el producto no tiene stock (no se puede vender sin
// saber en qué talla hay unidades disponibles).
function computeStock(sizes) {
  if (!sizes || sizes.length === 0) return 0;
  return sizes.reduce((sum, s) => sum + Number(s.stock || 0), 0);
}


const searchProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      order,
      page = 1,
      limit = 10,
    } = req.query;

    let filters = {};
    if (q) {
      filters.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filters.category = category;

    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === "true") filters.stock = { $gt: 0 };
    else if (inStock === "false") filters.stock = { $lte: 0 };

    let sortOptions = {};

    if (sort) {
      const sortOrder = order === "desc" ? -1 : 1;
      sortOptions[sort] = sortOrder;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filters)
      .populate("category")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(filters);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: totalProducts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const {
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 5,
    } = req.query;

    let filters = {};
    filters.stock = { $gt: 0 };

    let sortOptions = {};

    if (sort) {
      const sortOrder = order === "desc" ? -1 : 1;
      sortOptions[sort] = sortOrder;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filters)
      .populate("category")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(filters);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults: totalProducts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, imageURL, category, sizes } = req.body;
    const newProduct = await Product.create({
      name,
      description,
      price,
      stock: computeStock(sizes),
      sizes,
      imageURL,
      category,
    });
    await newProduct.populate("category");
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageURL, category, sizes } = req.body;
    const update = { name, description, price, sizes, imageURL, category };
    // Solo recalculamos el stock cuando la actualización trae tallas: así una
    // edición parcial (ej. solo el precio) no borra el stock existente.
    if (sizes !== undefined) {
      update.stock = computeStock(sizes);
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, update, {
      new: true,
    }).populate("category");
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

const uploadProductImageController = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se recibio ninguna imagen" });
  }
  res.status(201).json({ imageURL: `/uploads/products/${req.file.filename}` });
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  searchProducts,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImageController,
};
