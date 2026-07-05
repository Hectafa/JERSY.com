# Pendientes para que la API (ecommerce-api) quede 100% funcional

> Generado el 2026-07-05 a partir del estado real del código después de las rondas de corrección anteriores (ver `docs/testing/test-matrix.md` para el historial completo de qué ya se arregló y con qué test se confirmó). Esta lista es específica del **backend**; al final se incluye una sección corta de piezas del frontend que dependen de endpoints de esta API y quedaron sin construir, para no perder el contexto completo.

## 1. Defectos reales confirmados, todavía sin corregir

### 1.1 `addressRoutes.js` no tiene ninguna validación de entrada
A diferencia de **todas** las demás rutas de recursos (`cartRoutes.js`, `orderRoutes.js`, `productRoutes.js`, `userRoutes.js`), `src/routes/addressRoutes.js` no usa `express-validator` en absoluto — ni siquiera valida que `:addressId` sea un ObjectId válido.

```js
router.get("/addresses/:addressId", authMiddleware, getAddressById);
router.put("/addresses/:addressId", authMiddleware, updateAddress);
router.delete("/addresses/:addressId", authMiddleware, deleteAddress);
```

**Consecuencia real**: pedir `GET /api/addresses/no-es-un-id` no da un 422 limpio — Mongoose lanza un `CastError` al intentar convertir `"no-es-un-id"` a ObjectId, que el `try/catch` del controlador atrapa y pasa a `errorHandler`, respondiendo **500 genérico** en vez de un error de validación intencional.

**Fix sugerido**: crear `src/validators/addressValidators.js` (mismo patrón que `userValidators.js`/`cartValidators.js`) con `addressIdValidation` (`param("addressId").isMongoId()`) y validación básica del body (`address`, `city`, `state`, `postalCode`, `country`, `phone` no vacíos), conectarlo en `addressRoutes.js` con el middleware `validate` existente.

### 1.2 `createPaymentValidation` no valida `cardNumber` (solo `updatePaymentValidation` lo hace)
En `paymentMethodRoutes.js`, la validación de longitud de `cardNumber` (`isLength({ max: 16 })`) solo existe en `updatePaymentValidation` (PUT). `createPaymentValidation` (POST, creación de un método de pago nuevo) no valida `cardNumber` en absoluto — se puede crear un método de pago con un número de cualquier longitud.

Nota: el mismatch de longitud entre frontend (19 caracteres con guiones) y backend ya se corrigió del lado del frontend (`Checkout.jsx` limpia los guiones antes de enviar), así que hoy no es explotable desde la UI real. Pero la inconsistencia en el backend sigue ahí — un cliente que llame a la API directamente (Postman, otro frontend, etc.) puede crear un método de pago con un `cardNumber` inválido.

**Fix sugerido**: agregar la misma regla `body("cardNumber").optional().isLength({ max: 16 })` a `createPaymentValidation`.

### 1.3 `addProductToCart` es código muerto
`cartController.js` exporta `addProductToCart`, pero ninguna ruta en `cartRoutes.js` la usa — no es alcanzable por HTTP. Además, tiene un bug propio si алguna vez se conecta: en la línea `await cart.populate("products.productId")`, el campo real del schema es `products.product` (no `products.productId`), así que ese populate no haría nada.

**Fix sugerido**: decidir si esta función se expone como ruta (por ejemplo `POST /api/cart/add`, que parece ser su propósito original: agregar un producto incrementando cantidad si ya existe) o si se elimina por completo. Si se expone, corregir también el populate y agregarle el mismo `validateStock` que ya tienen `createCart`/`updateCart`.

## 2. Huecos de cobertura de test (no son bugs conocidos, pero no están verificados)

| Área | Qué falta | Por qué importa |
|------|-----------|------------------|
| `PUT /api/products/:id` | Sin test de integración de la actualización en sí (solo creación/eliminación están cubiertas) | Es el único endpoint CRUD de productos sin verificar |
| Métodos de pago (`PAY-001`) | Sin test de integración para crear/editar/eliminar vía `POST/PUT/DELETE /api/payment-methods` | Solo se usa `createPaymentMethod` como fixture para pruebas de órdenes, nunca se prueba el endpoint en sí |
| Categorías (`CAT-001`) | Sin ningún test dedicado a `GET /api/categories`, `GET /api/categories/:id/products` | Solo se ejercita indirectamente vía catálogo en E2E |
| Wishlist (`WISH-001`) | Backend completo (`wishlistController.js`/`wishlistRoutes.js`) sin ningún test | Bloqueado en la práctica porque tampoco hay consumidor frontend (ver sección 3) |
| Búsqueda de productos (`PROD-002`) | Backend cubierto, pero sin test de frontend/E2E que ejercite una UI de búsqueda avanzada | No se sabe si el frontend realmente expone todos los filtros que el backend soporta |

## 3. Piezas del frontend que dependen de esta API y quedaron sin construir

Estas no son bugs de la API — la API ya soporta lo necesario — pero la API no está "100% funcional" de punta a punta mientras nadie la consuma correctamente:

- **Wishlist**: `wishlistController.js`/`wishlistRoutes.js` funcionan completos (`GET/POST/DELETE /api/wishlist`), pero no existe `wishlistService.js` en el frontend ni una UI real en `WishList.jsx` (está vacío). La API es inalcanzable para el usuario final.
- **`userService.js`** (frontend) no llama a la API real — lee `src/data/users.json` con un `setTimeout` simulado. Si alguna pantalla depende de esto pensando que refleja usuarios reales, está mostrando datos falsos.
- **`Setttings.jsx`** (nótese el typo en el nombre del archivo) es un stub vacío, y no existe ningún endpoint backend pensado para "configuración de cuenta" — antes de construir la UI habría que decidir qué debería hacer (¿cambiar contraseña? ¿preferencias?) y diseñar el endpoint correspondiente.
- **`ProfileCard.jsx`**: los botones "Editar Perfil", "Cambiar contraseña", "Ver mis pedidos", "Panel de administración" no llaman a ningún endpoint (son no-ops `() => {}`), aunque la API ya tiene `PUT /api/users/:id` (recién corregido) que podría usarse para "Editar Perfil".
- **Página `/orders`**: nunca consulta `GET /api/orders`/`GET /api/orders/:id` — vive enteramente de `localStorage`. Si el objetivo es que el usuario vea el estado real de sus pedidos (por ejemplo si un admin cambia el `status` vía `PUT /api/orders/:id`), esta pantalla necesita reescribirse para consumir la API en vez de memoria local.
