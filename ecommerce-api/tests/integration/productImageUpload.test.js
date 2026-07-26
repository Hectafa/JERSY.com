import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../../src/app.js";
import { PRODUCTS_DIR } from "../../src/middlewares/uploadProductImage.js";
import { createUser, createAdmin, authHeader } from "../helpers/fixtures.js";

// PNG de 1x1 válido, suficiente para pasar el fileFilter (mimetype real de imagen).
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const uploadedFiles = [];

const trackAndGetFilename = (imageURL) => {
  const filename = path.basename(imageURL);
  uploadedFiles.push(filename);
  return filename;
};

afterEach(() => {
  while (uploadedFiles.length) {
    const filename = uploadedFiles.pop();
    fs.rmSync(path.join(PRODUCTS_DIR, filename), { force: true });
  }
});

describe("POST /api/products/upload-image", () => {
  it("permite a un admin subir una imagen de producto", async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .post("/api/products/upload-image")
      .set("Authorization", authHeader(token))
      .attach("image", TINY_PNG, "photo.png");

    expect(res.status).toBe(201);
    expect(res.body.imageURL).toMatch(/^\/uploads\/products\//);
    trackAndGetFilename(res.body.imageURL);

    const filePath = path.join(PRODUCTS_DIR, path.basename(res.body.imageURL));
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("rechaza con 403 cuando un customer intenta subir una imagen", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post("/api/products/upload-image")
      .set("Authorization", authHeader(token))
      .attach("image", TINY_PNG, "photo.png");

    expect(res.status).toBe(403);
  });

  it("rechaza con 401 sin token de autenticación", async () => {
    const res = await request(app)
      .post("/api/products/upload-image")
      .attach("image", TINY_PNG, "photo.png");

    expect(res.status).toBe(401);
  });

  it("rechaza con 400 cuando no se envía ningún archivo", async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .post("/api/products/upload-image")
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(400);
  });

  it("rechaza con 400 archivos que no son imágenes permitidas", async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .post("/api/products/upload-image")
      .set("Authorization", authHeader(token))
      .attach("image", Buffer.from("no soy una imagen"), {
        filename: "archivo.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
  });

  it("rechaza con 400 cuando la imagen pesa más de 5MB", async () => {
    const { token } = await createAdmin();
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 1);

    const res = await request(app)
      .post("/api/products/upload-image")
      .set("Authorization", authHeader(token))
      .attach("image", oversized, {
        filename: "grande.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
  });

  it("genera nombres de archivo únicos para subidas consecutivas", async () => {
    const { token } = await createAdmin();

    const first = await request(app)
      .post("/api/products/upload-image")
      .set("Authorization", authHeader(token))
      .attach("image", TINY_PNG, "first.png");
    trackAndGetFilename(first.body.imageURL);

    const second = await request(app)
      .post("/api/products/upload-image")
      .set("Authorization", authHeader(token))
      .attach("image", TINY_PNG, "second.png");
    trackAndGetFilename(second.body.imageURL);

    expect(first.body.imageURL).not.toBe(second.body.imageURL);
  });
});
