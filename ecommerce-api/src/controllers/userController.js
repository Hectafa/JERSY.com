import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { AVATARS_DIR } from "../middlewares/uploadAvatar.js";

const generatePassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isOwner = req.user.userId === id;
    const isAdminUser = req.user.role === "admin";
    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Unauthorized to view this user" });
    }
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const hashPassword = await generatePassword(password);
    const newUser = await User.create({
      name,
      email,
      password: hashPassword,
      role,
    });
    const userResponse = newUser.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    // FIX (bug real, 500 siempre): antes decía
    //   const { name, email, role } = req.body;
    //   const hashPassword = await generatePassword(password);
    // `password` no estaba destructurada, así que `generatePassword(password)`
    // lanzaba un ReferenceError en cada request a esta ruta. Ahora se
    // destructura `password` y solo se hashea/actualiza si el cliente
    // realmente envió una contraseña nueva.
    const { name, email, password, role } = req.body;
    const isOwner = req.user.userId === id;
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({ message: "Unauthorized to update this user" });
    }
    const update = isAdminUser ? { name, email, role } : { name, email };
    if (isAdminUser && password) {
      update.password = await generatePassword(password);
    }

    const updatedUser = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isOwner = req.user.userId === id;
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(403).json({ message: "Unauthorized to update this user" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const user = await User.findById(id);
    if (!user) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: "User not found" });
    }

    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(AVATARS_DIR, path.basename(user.avatar));
      await fs.promises.unlink(oldPath).catch(() => {});
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.userId !== id) {
      return res.status(403).json({ message: "Unauthorized to change password"});
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if(!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await generatePassword(newPassword);
    await user.save();

    res.status(200).json({ message: "Password changed succesfully" });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateAvatar,
  changePassword,
  deleteUser,
};
