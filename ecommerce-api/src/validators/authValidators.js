import { body } from "express-validator";

// NUEVO (fix): antes /auth/register y /auth/login no tenían ninguna cadena
// de express-validator, a diferencia del resto de las rutas de la API. Un
// body vacío o malformado no daba un 422 intencional, sino que caía a un
// error de Mongoose capturado como 500 genérico por errorHandler. Estas dos
// validaciones siguen el mismo patrón que userValidators.js/productValidators.js.
// El mínimo de 6 caracteres para el password coincide con el que ya exige
// createUserValidation y con la validación del lado del cliente en RegisterForm.jsx.

export const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("A valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
