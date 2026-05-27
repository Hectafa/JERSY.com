import WishList from "../models/WhishList.js";

const getWishlists = async (req, res, next) => {
  try {
    const wishlists = await WishList.find()
      .populate("user")
      .populate("products");
    res.status(200).json(wishlists);
  } catch (error) {
    next(error);
  }
};

const getWishlistByUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await WishList.findOne({ user: id })
      .populate("user")
      .populate("products");
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    res.status(200).json(wishlist);
  } catch (error) {
    next(error);
  }
};

const addProductToWishlist = async (req, res, next) => {
  try {
    const { userId, productId } = req.body;
    let wishlist = await WishList.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new WishList({ user: userId, products: [productId] });
    } else {
      const alreadyAdded = wishlist.products.some(
        (p) => p.toString() === productId
      );
      if (alreadyAdded) {
        return res
          .status(200)
          .json({ message: "Product already in wishlist", wishlist });
      }
      wishlist.products.push(productId);
    }

    await wishlist.save();
    await wishlist.populate("user");
    await wishlist.populate("products");
    res.status(200).json(wishlist);
  } catch (error) {
    next(error);
  }
};

const removeProductFromWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;
    const wishlist = await WishList.findById(id);
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    await wishlist.save();
    await wishlist.populate("user");
    await wishlist.populate("products");
    res.status(200).json(wishlist);
  } catch (error) {
    next(error);
  }
};

const deleteWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await WishList.findByIdAndDelete(id);
    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getWishlists,
  getWishlistByUser,
  addProductToWishlist,
  removeProductFromWishlist,
  deleteWishlist,
};
