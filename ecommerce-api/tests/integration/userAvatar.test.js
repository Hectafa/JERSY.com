import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import { AVATARS_DIR } from "../../src/middlewares/uploadAvatar.js";
import { createUser, createAdmin, authHeader } from "../helpers/fixtures.js";

// PNG de 1x1 válido, suficiente para pasar el fileFilter (mimetype real de imagen).
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const uploadedFiles = [];

const trackAndGetFilename = (avatarPath) => {
  const filename = path.basename(avatarPath);
  uploadedFiles.push(filename);
  return filename;
};

afterEach(() => {
  while (uploadedFiles.length) {
    const filename = uploadedFiles.pop();
    fs.rmSync(path.join(AVATARS_DIR, filename), { force: true });
  }
});

describe("PUT /api/users/:id/avatar", () => {
  it("permite al dueño subir su foto de perfil", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .put(`/api/users/${user._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", TINY_PNG, "photo.png");

    expect(res.status).toBe(200);
    expect(res.body.avatar).toMatch(/^\/uploads\/avatars\//);
    expect(res.body.password).toBeUndefined();
    trackAndGetFilename(res.body.avatar);

    const filePath = path.join(AVATARS_DIR, path.basename(res.body.avatar));
    expect(fs.existsSync(filePath)).toBe(true);

    const stored = await User.findById(user._id);
    expect(stored.avatar).toBe(res.body.avatar);
  });

  it("permite a un admin subir la foto de otro usuario", async () => {
    const { token } = await createAdmin();
    const { user: target } = await createUser();

    const res = await request(app)
      .put(`/api/users/${target._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", TINY_PNG, "photo.png");

    expect(res.status).toBe(200);
    trackAndGetFilename(res.body.avatar);
  });

  it("rechaza con 403 cuando un customer intenta subir la foto de otro usuario", async () => {
    const { token } = await createUser();
    const { user: other } = await createUser();

    const res = await request(app)
      .put(`/api/users/${other._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", TINY_PNG, "photo.png");

    expect(res.status).toBe(403);

    const stored = await User.findById(other._id);
    expect(stored.avatar).toBeNull();
  });

  it("no deja el archivo huérfano en disco cuando el 403 ocurre después del upload", async () => {
    const { token } = await createUser();
    const { user: other } = await createUser();

    // AVATARS_DIR es la misma carpeta que usa el server en dev, así que puede
    // traer archivos reales de antes; comparamos por delta, no por vacío.
    const filesBefore = fs.readdirSync(AVATARS_DIR);

    const res = await request(app)
      .put(`/api/users/${other._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", TINY_PNG, "photo.png");

    expect(res.status).toBe(403);
    // multer ya escribió el archivo en disco antes del check de autorización;
    // el controller debe limpiarlo en vez de dejarlo huérfano.
    const filesAfter = fs.readdirSync(AVATARS_DIR);
    expect(filesAfter).toHaveLength(filesBefore.length);
  });

  it("rechaza con 400 cuando no se envía ningún archivo", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .put(`/api/users/${user._id}/avatar`)
      .set("Authorization", authHeader(token));

    expect(res.status).toBe(400);
  });

  it("rechaza con 400 archivos que no son imágenes permitidas", async () => {
    const { user, token } = await createUser();

    const res = await request(app)
      .put(`/api/users/${user._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", Buffer.from("no soy una imagen"), {
        filename: "archivo.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);

    const stored = await User.findById(user._id);
    expect(stored.avatar).toBeNull();
  });

  it("rechaza con 400 cuando la imagen pesa más de 2MB", async () => {
    const { user, token } = await createUser();
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1, 1);

    const res = await request(app)
      .put(`/api/users/${user._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", oversized, {
        filename: "grande.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);

    const stored = await User.findById(user._id);
    expect(stored.avatar).toBeNull();
  });

  it("reemplaza el avatar anterior y borra el archivo viejo del disco", async () => {
    const { user, token } = await createUser();

    const first = await request(app)
      .put(`/api/users/${user._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", TINY_PNG, "first.png");

    expect(first.status).toBe(200);
    const firstFilename = trackAndGetFilename(first.body.avatar);
    const firstPath = path.join(AVATARS_DIR, firstFilename);
    expect(fs.existsSync(firstPath)).toBe(true);

    const second = await request(app)
      .put(`/api/users/${user._id}/avatar`)
      .set("Authorization", authHeader(token))
      .attach("avatar", TINY_PNG, "second.png");

    expect(second.status).toBe(200);
    trackAndGetFilename(second.body.avatar);

    expect(second.body.avatar).not.toBe(first.body.avatar);
    expect(fs.existsSync(firstPath)).toBe(false);

    const stored = await User.findById(user._id);
    expect(stored.avatar).toBe(second.body.avatar);
  });

  it("rechaza con 401 sin token de autenticación", async () => {
    const { user } = await createUser();

    const res = await request(app)
      .put(`/api/users/${user._id}/avatar`)
      .attach("avatar", TINY_PNG, "photo.png");

    expect(res.status).toBe(401);
  });
});
