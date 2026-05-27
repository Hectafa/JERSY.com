import Address from "../models/Address";

const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1,
      _id: -1,
    });

    res.status(200).json({ addresses });
  } catch (error) {
    next(error);
  }
};

const getAddressById = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.userId;

    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json(address);
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const {
      name,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      addressType,
    } = req.body;
    const user = req.user.userId;

    if (isDefault) {
      await Address.updateMany({ user }, { isDefault: false });
    }

    const newAddress = new Address({
      user,
      name,
      address,
      city,
      state,
      postalCode,
      country: country || "México",
      phone,
      isDefault: isDefault || false,
      addressType: addressType || "home",
    });

    await newAddress.save();

    res.status(201).json(newAddress);
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const {
      name,
      address,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
      addressType,
    } = req.body;
    const user = req.user.userId;

    const shipAddress = await Address.findOne({ _id: addressId, user: userId });
    if (!shipAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (isDefault && !shipAddress.isDefault) {
      await Address.updateMany(
        { user: userId, _id: { $ne: addressId } },
        { isDefault: false },
      );
    }

    shipAddress.name = name;
    shipAddress.address = address;
    shipAddress.city = city;
    shipAddress.state = state;
    shipAddress.postalCode = postalCode;
    shipAddress.country = country || shipAddress.country;
    shipAddress.phone = phone;
    shipAddress.isDefault =
      isDefault !== undefined ? isDefault : shipAddress.isDefault;
    shipAddress.addressType = addressType || shipAddress.addressType;

    await shipAddress.save();

    res.status(200).json(shipAddress);
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.userId;

    const shipAddress = await Address.findOne({
      _id: addressId,
      user: userId,
    });

    if (!shipAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    await Address.findByIdAndDelete(addressId);

    res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
};
