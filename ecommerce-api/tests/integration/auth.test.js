import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/User.js";
import { createUser } from "../helpers/fixtures.js";

describe("POST /api/auth/register", () => {
  it("registra un usuario nuevo y lo persiste en la base de datos", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123!",
      phone: "1234567890",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com" });

    const stored = await User.findOne({ email: "ada@example.com" });
    expect(stored).not.toBeNull();
    expect(stored.role).toBe("customer");
    expect(stored.password).not.toBe("Password123!");
  });

  it("rechaza el registro cuando el email ya existe", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password123!",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Otra Persona",
      email: "ada@example.com",
      password: "OtherPass123!",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");

    const count = await User.countDocuments({ email: "ada@example.com" });
    expect(count).toBe(1);
  });

  it("guarda la contraseña con hash y no en texto plano", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "PlainText123!",
    });

    const stored = await User.findOne({ email: "grace@example.com" });
    expect(stored.password).not.toBe("PlainText123!");
    expect(stored.password.length).toBeGreaterThan(20);
  });

  // NUEVO: junto con el fix que agrega registerValidation/loginValidation a
  // authRoutes.js, antes un body malformado no daba 422 sino que caía a un
  // 500 genérico (error de Mongoose capturado por errorHandler).
  it("rechaza con 422 cuando falta el nombre", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "sin-nombre@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(422);
  });

  it("rechaza con 422 cuando el email tiene formato inválido", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sin Email Válido",
      email: "no-es-un-email",
      password: "Password123!",
    });

    expect(res.status).toBe(422);
  });

  it("rechaza con 422 cuando el password tiene menos de 6 caracteres", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Password Corto",
      email: "passwordcorto@example.com",
      password: "123",
    });

    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/login", () => {
  it("inicia sesión con credenciales válidas y devuelve token + refreshToken", async () => {
    const { user, password } = await createUser({ password: "Secret123!" });

    const res = await request(app).post("/api/auth/login").send({
      email: user.email,
      password,
    });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
  });

  it("rechaza el login con contraseña incorrecta", async () => {
    const { user } = await createUser({ password: "Secret123!" });

    const res = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "wrong-password",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(res.body.token).toBeUndefined();
  });

  it("rechaza el login de un usuario inexistente", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "no-existe@example.com",
      password: "whatever123",
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  // NUEVO: mismo fix de validación que en /register.
  it("rechaza con 422 cuando el email tiene formato inválido", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "no-es-un-email",
      password: "cualquiera123",
    });

    expect(res.status).toBe(422);
  });

  it("rechaza con 422 cuando falta el password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "ada@example.com",
    });

    expect(res.status).toBe(422);
  });
});
