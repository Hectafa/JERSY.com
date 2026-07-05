import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  const dbURI = process.env.MONGODB_URI;

  await mongoose.connect(dbURI, {});

  // Categorías principales
  const mainCategories = [
    { name: "Celulares", description: "Smartphones y accesorios" },
    { name: "Macs", description: "Laptops y computadoras Apple" },
    { name: "PCs", description: "Laptops y computadoras Windows" },
    { name: "Gadgets", description: "Tecnología y accesorios" },
  ];

  // Subcategorías
  const subCategories = [
    { name: "iPhone", description: "Modelos de iPhone", parent: "Celulares" },
    { name: "Android", description: "Modelos Android", parent: "Celulares" },
    { name: "MacBook", description: "Laptops MacBook", parent: "Macs" },
    {
      name: "Smartwatch",
      description: "Relojes inteligentes",
      parent: "Gadgets",
    },
    {
      name: "Auriculares",
      description: "Audífonos y accesorios",
      parent: "Gadgets",
    },
    { name: "Gaming", description: "PCs para gaming", parent: "PCs" },
  ];

  // Limpiar colecciones
  await Category.deleteMany({});
  await Product.deleteMany({});

  // Insertar categorías principales
  const categories = {};
  for (const cat of mainCategories) {
    const category = new Category(cat);
    await category.save();
    categories[cat.name] = category;
  }

  // Insertar subcategorías
  const subCatDocs = {};
  for (const sub of subCategories) {
    const parent = categories[sub.parent];
    const subCat = new Category({
      name: sub.name,
      description: sub.description,
      parentCategory: parent._id,
    });
    await subCat.save();
    subCatDocs[sub.name] = subCat;
  }

  // Productos de prueba
  const productsData = [
    {
      name: "iPhone 15 Pro",
      description: "El último smartphone de Apple con chip A17 Pro.",
      price: 1299,
      stock: 10,
      imageURL: "./img/products/iPhone 14 Pro.jpg",
      category: subCatDocs["iPhone"]._id,
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      description: "Smartphone premium con cámara de 200MP.",
      price: 1199,
      stock: 15,
      imageURL: "./img/products/Samsung Galaxy S23.jpg",
      category: subCatDocs["Android"]._id,
    },
    {
      name: "MacBook Pro M3",
      description: "Laptop profesional con chip Apple M3.",
      price: 2499,
      stock: 8,
      imageURL: "./img/products/MacBook Air M2.jpg",
      category: subCatDocs["MacBook"]._id,
    },
    {
      name: "Dell XPS 15",
      description: "Laptop potente para trabajo y gaming.",
      price: 1899,
      stock: 12,
      imageURL: "./img/products/Dell XPS 13.jpeg",
      category: subCatDocs["Gaming"]._id,
    },
    {
      name: "Apple Watch Series 9",
      description: "Smartwatch avanzado con sensores de salud.",
      price: 499,
      stock: 25,
      imageURL: "./img/products/applewatch9.png",
      category: subCatDocs["Smartwatch"]._id,
    },
    {
      name: "Sony WH-1000XM5",
      description: "Audífonos inalámbricos con cancelación de ruido.",
      price: 399,
      stock: 30,
      imageURL: "./img/products/Sony WH-1000XM5.avif",
      category: subCatDocs["Auriculares"]._id,
    },
    {
      name: "Lenovo Legion 7",
      description: "Laptop gamer con RTX 4080.",
      price: 2599,
      stock: 7,
      imageURL: "./img/products/Lenovo Legion 7.avif",
      category: subCatDocs["Gaming"]._id,
    },
    {
      name: "Google Pixel 8",
      description: "Smartphone con Android puro y excelente cámara.",
      price: 899,
      stock: 18,
      imageURL: "./img/products/Google Pixel 7.jpg",
      category: subCatDocs["Android"]._id,
    },
    {
      name: "AirPods Pro 2",
      description: "Auriculares inalámbricos con audio espacial.",
      price: 299,
      stock: 40,
      imageURL: "./img/products/airpodspro2.jpeg",
      category: subCatDocs["Auriculares"]._id,
    },
  ];

  for (const prod of productsData) {
    const product = new Product(prod);
    await product.save();
  }

  console.log("Datos de prueba insertados correctamente.");
  await mongoose.disconnect();
}

seed();
