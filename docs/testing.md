# Estrategia de pruebas — 2026-2-ReactFS (ecommerce-app)

Este documento describe la suite de pruebas automatizadas del frontend
(`ecommerce-app/`): pruebas unitarias/integración con Jest + React Testing
Library, y pruebas E2E con Cypress. El backend (`ecommerce-api/`) no tiene
pruebas propias; se usa como dependencia real para las pruebas E2E.

## 1. Estrategia general

- **Unitarias / integración de componentes** (Jest + React Testing Library,
  vía `react-scripts test`): prueban componentes y contextos en aislamiento,
  con los servicios HTTP mockeados (`jest.mock`). Verifican comportamiento
  observable (lo que ve/hace el usuario), no detalles internos.
- **E2E (Cypress)**: prueban el flujo real de principio a fin contra el
  frontend servido (`npm start`) y el backend real (`ecommerce-api`, con
  MongoDB), sin mockear la API. Usan `cy.intercept` solo para *observar*
  peticiones (alias/esperas), no para sustituir al backend.

### Por qué no se usó Vitest

El encargo original pedía Vitest si el proyecto usa Vite. `ecommerce-app`
está construido con **Create React App** (`react-scripts` 5.0.1), no Vite, y
ya trae Jest + React Testing Library integrados (`react-scripts test`,
`src/setupTests.js`). Se usó ese runner en vez de añadir un segundo runner
redundante.

## 2. Dependencias instaladas

Ya estaban en `dependencies` (sin usarse hasta ahora):

- `@testing-library/react` 16.3.0, `@testing-library/dom`,
  `@testing-library/jest-dom` 6.8.0, `@testing-library/user-event` **13.5.0**
  (API síncrona, sin `userEvent.setup()`, distinta a la v14).

Se agregaron como `devDependencies`:

- `cypress` ^15.18.0
- `start-server-and-test` ^3.0.11

No se instaló Vitest ni Jest adicional (ver arriba).

## 3. Estructura de carpetas

```
ecommerce-app/
├── cypress.config.js
├── cypress.env.json.example       # plantilla; cypress.env.json real está en .gitignore
├── src/
│   ├── setupTests.js               # jest-dom + polyfills TextEncoder/TextDecoder
│   ├── components/LoginForm/LoginForm.test.jsx
│   ├── components/RegisterForm/RegisterForm.test.jsx
│   ├── context/CartContext.test.jsx
│   └── pages/{Home,Checkout}.test.jsx
└── cypress/
    ├── e2e/
    │   ├── auth/
    │   │   ├── register.cy.js
    │   │   └── login.cy.js
    │   └── checkout/
    │       └── checkout.cy.js
    ├── fixtures/
    │   ├── users.json
    │   └── products.json
    ├── support/
    │   ├── commands.js              # cy.loginByApi, cy.registerByApi, cy.addProductToCart, cy.getSeededProduct
    │   └── e2e.js
    └── utils/
        └── testData.js              # generadores de datos únicos (usuario/dirección/pago)
```

## 4. Variables de entorno requeridas

| Variable | Dónde | Para qué | Requerida |
|---|---|---|---|
| `CYPRESS_API_URL` | shell / CI | Sobreescribe la URL del API (default `http://localhost:4000/api`) | No |
| `CYPRESS_TEST_USER_EMAIL` / `CYPRESS_TEST_USER_PASSWORD` | shell / CI / `cypress.env.json` | Usuario fijo opcional para `cy.loginByApi()` sin argumentos | No (las specs registran usuarios únicos con `cy.registerByApi()`) |

Copia `ecommerce-app/cypress.env.json.example` a `cypress.env.json` (ya
ignorado por git) si quieres fijar un usuario conocido en vez de que cada
prueba registre uno nuevo.

El backend requiere su propio `.env` (`PORT`, `MONGODB_URI`, `JWT_SECRET`,
`JWT_REFRESH_TOKEN`, ...) tal como ya está documentado/ignorado en
`ecommerce-api/`.

## 5. Cómo ejecutar las pruebas unitarias

```bash
cd ecommerce-app
npm install
npm run test:run        # una sola corrida, sin watch
npm test                # modo watch (comportamiento original de CRA)
```

## 6. Cómo ejecutar cobertura

```bash
cd ecommerce-app
npm run test:coverage
```

Genera un reporte en consola y en `ecommerce-app/coverage/` (ignorado por
git). Cobertura actual de la suite entregada: **31.2% statements / 23.3%
branches / 22.64% funcs / 32.41% lines** sobre el total del proyecto — la
cobertura se concentra en los módulos con lógica de negocio real (auth,
carrito, checkout); páginas triviales, componentes de layout puramente
visuales y módulos administrativos sin UI (usuarios, wishlist) no fueron
priorizados.

## 7. Cómo abrir Cypress (modo interactivo)

Requiere el backend (`ecommerce-api`) corriendo con MongoDB accesible, y el
catálogo poblado:

```bash
# Terminal 1
cd ecommerce-api
npm install
npm run seedProducts   # solo la primera vez / cuando quieras resetear catálogo
npm start               # sirve en http://localhost:4000

# Terminal 2
cd ecommerce-app
npm install
npm start                # sirve en http://localhost:3000

# Terminal 3
cd ecommerce-app
npm run cypress:open
```

## 8. Cómo ejecutar Cypress en modo headless

```bash
cd ecommerce-app
npm run cypress:run          # requiere que ecommerce-app y ecommerce-api ya estén corriendo
npm run test:e2e:ci          # levanta el frontend automáticamente con start-server-and-test
                              # y luego corre Cypress (requiere ecommerce-api ya corriendo aparte)
```

`npm run test:e2e:ci` usa `start-server-and-test` para esperar a que
`http://localhost:3000` responda antes de lanzar Cypress, pero **no** levanta
el backend — arráncalo tú antes (o añade un segundo `start-server-and-test`
apuntando también al backend si lo integras a un pipeline).

## 9. Cómo crear usuarios de prueba

No hay una cuenta fija: cada prueba genera un usuario único con
`cy.registerByApi()` (ver `cypress/support/commands.js` y
`cypress/utils/testData.js`), que llama a `POST /api/auth/register` con un
email `cypress-<timestamp>-<random>@example.com`. Esto evita colisiones
entre corridas y hace cada prueba independiente del orden de ejecución.

Si prefieres un usuario fijo conocido (por ejemplo para pipelines que
reutilizan una base de datos de staging), defínelo en `cypress.env.json` /
variables `CYPRESS_TEST_USER_EMAIL` y `CYPRESS_TEST_USER_PASSWORD`, y llama
`cy.loginByApi()` sin argumentos.

## 10. Cómo preparar datos (productos, direcciones, pagos)

- **Productos**: `npm run seedProducts` en `ecommerce-api` (pobla
  `Category` y `Product`). Las specs obtienen un producto real con
  `cy.getSeededProduct()` (hace `GET /api/products?limit=1`) — nunca se
  hardcodean IDs de Mongo.
- **Direcciones / métodos de pago**: se crean vía la UI real dentro de
  `checkout.cy.js` (los formularios de dirección y pago llaman de verdad a
  `POST /api/addresses` y `POST /api/payment-methods`; antes de la
  corrección aplicada en este trabajo, Checkout nunca llamaba a esos
  endpoints — ver sección de defectos).

## 11. Cómo limpiar datos

El backend no expone un endpoint de "reset" ni un script de limpieza de
usuarios/órdenes/direcciones — solo `npm run seedProducts` (y solo para
categorías/productos, no borra usuarios/órdenes). Limitaciones documentadas:

- Los usuarios creados por `cy.registerByApi()` **no se eliminan** después
  de cada corrida (no existe `DELETE /api/users/:id` de autoservicio sin rol
  admin, y usar un token admin desde las pruebas no es una alternativa
  segura para un repo de curso). Con el tiempo se acumulan usuarios de
  prueba en la base de datos usada para Cypress.
- Las direcciones, métodos de pago y órdenes creadas durante `checkout.cy.js`
  tampoco se limpian automáticamente.
- **Mitigación recomendada**: correr Cypress contra una base de datos
  *dedicada a pruebas* (ya el `.env` de ejemplo usa
  `mongodb://localhost:27017/ecommerce-db-test`, separada de cualquier BD de
  desarrollo/demo) y resetearla manualmente (`mongosh` `db.dropDatabase()`
  o un script de administración) antes de una demo o entre corridas largas
  de CI si el volumen de datos generados se vuelve un problema.

## 12. Cómo funcionan `cy.loginByApi()` y `cy.addProductToCart()`

### `cy.loginByApi({ email, password })`

1. Si no se pasan credenciales, usa `Cypress.env('TEST_USER_EMAIL'/'TEST_USER_PASSWORD')`.
2. Envía `POST /api/auth/login` con `{ email, password }` (la forma real que
   espera el backend).
3. Verifica `status === 200` y que la respuesta traiga `token`; si no, lanza
   un error explícito (no deja la prueba colgada ni sigue en silencio).
4. Visita el origen de la app (`/`) **antes** de escribir en `localStorage`,
   para que `cy.session()` capture el storage bajo el origen correcto
   (`http://localhost:3000`) — el mismo mecanismo que usa `AuthContext` en
   producción (`localStorage["authToken"]`, sin cookies).
5. Usa `cy.session()` (cacheado por email) para no repetir el login de red
   en cada prueba que use el mismo usuario dentro de la misma corrida.

Esta app usa **JWT en localStorage**, no cookies HTTP-only, así que el
comando escribe directamente en `localStorage` en vez de depender de
cookies del navegador — se adaptó el ejemplo genérico del encargo a esta
realidad.

### `cy.addProductToCart({ productId, quantity })`

1. Obtiene el producto real vía `GET /api/products/:id` (para conocer su
   precio y poder verificar el subtotal esperado).
2. Visita `/product/:id` y usa la interfaz real: **no existe un input de
   cantidad** en `ProductDetails` (a diferencia del ejemplo genérico del
   encargo) — el botón "Agregar al carrito" siempre suma 1, así que el
   comando hace clic esa cantidad de veces.
3. Verifica: el contador del header (`cart-count`) queda en la cantidad
   esperada; al visitar `/cart`, el producto aparece
   (`cart-item-<id>`), su cantidad (`cart-item-quantity-<id>`) es correcta,
   y el subtotal (`cart-subtotal`) coincide con `precio × cantidad`.

## 13. Qué partes del checkout están mockeadas (y cuáles no)

**Nada del flujo de checkout probado por Cypress está mockeado.** A
diferencia de lo que sugería el estado original del código (ver sección de
defectos), tras la corrección aplicada:

- Crear una dirección / método de pago en el checkout llama de verdad a
  `POST /api/addresses` y `POST /api/payment-methods`.
- Confirmar la compra llama de verdad a `POST /api/orders` y la orden queda
  persistida en MongoDB.

No hay pasarela de pago externa en este proyecto (no hay Stripe/PayPal/etc.
integrado) — el "método de pago" es solo un registro de tarjeta simulada en
la propia base de datos, así que no hay nada que mockear ni sandbox de
terceros que configurar.

## 14. Qué servicios externos no pueden probarse completamente

- No hay servicios de pago, envío ni email reales integrados en el código
  actual — no aplica.
- **Cypress en sí no pudo ejecutarse en este entorno de trabajo puntual**
  (ver "Errores conocidos" — el binario queda interceptado por el sandbox
  usado en esta sesión). Sí se validó **manualmente, con `curl`, el flujo
  completo register → login → crear dirección → crear método de pago →
  crear orden** contra el backend real y una base de datos MongoDB real
  (ver más abajo) — esto confirma que la lógica que las specs de Cypress
  ejercitarían es correcta; solo falta correr las specs propiamente en una
  máquina donde el binario de Cypress pueda arrancar.

## 15. Tabla de `data-testid`

Solo se listan los identificadores realmente usados por alguna prueba.

| Módulo | Componente | Elemento | `data-testid` | Archivo |
|---|---|---|---|---|
| Login | LoginForm | Formulario | `login-form` | `src/components/LoginForm/LoginForm.jsx` |
| Login | LoginForm | Campo correo | `login-email-input` | idem |
| Login | LoginForm | Campo contraseña | `login-password-input` | idem |
| Login | LoginForm | Botón login | `login-submit-button` | idem |
| Login | LoginForm | Enlace a registro | `login-register-link` | idem |
| Login | LoginForm | Mensaje de error | `login-error-message` | idem |
| Registro | RegisterForm | Formulario | `register-form` | `src/components/RegisterForm/RegisterForm.jsx` |
| Registro | RegisterForm | Campo nombre / error | `register-name-input` / `register-name-error` | idem |
| Registro | RegisterForm | Campo correo / error | `register-email-input` / `register-email-error` | idem |
| Registro | RegisterForm | Campo contraseña / error | `register-password-input` / `register-password-error` | idem |
| Registro | RegisterForm | Confirmación / error | `register-confirm-password-input` / `register-confirm-password-error` | idem |
| Registro | RegisterForm | Campo teléfono / error | `register-phone-input` / `register-phone-error` | idem |
| Registro | RegisterForm | Botón registro | `register-submit-button` | idem |
| Registro | RegisterForm | Enlace a login | `register-login-link` | idem |
| Registro | RegisterErrorMessage | Errores de servidor/red/etc. | `form-error-network` / `form-error-server` / `form-error-bad-request` / `form-error-unknown` | `src/components/RegisterErrorMessage/RegisterErrorMessage.jsx` |
| Productos | ProductCard | Tarjeta | `product-card-{id}` | `src/components/ProductCard/ProductCard.jsx` |
| Productos | ProductCard | Agregar al carrito | `add-to-cart-button-{id}` | idem |
| Productos | ProductDetails | Detalle | `product-detail` | `src/components/ProductDetails/ProductDetails.jsx` |
| Productos | ProductDetails | Agregar al carrito | `add-to-cart-button` | idem |
| Productos | ProductDetails | Ir al carrito | `go-to-cart-link` | idem |
| Carrito | Header | Contador | `cart-count` | `src/layout/Header/Header.jsx` |
| Carrito | Cart (página) | Vacío | `cart-empty` | `src/pages/Cart.jsx` |
| Carrito | Cart (página) | Subtotal | `cart-subtotal` | idem |
| Carrito | Cart (página) | Continuar a checkout | `cart-checkout-button` | idem |
| Carrito | CartView | Producto | `cart-item-{productId}` | `src/components/Cart/CartView.jsx` |
| Carrito | CartView | Cantidad | `cart-item-quantity-{productId}` | idem |
| Carrito | CartView | Incrementar / decrementar | `cart-item-increase-{productId}` / `cart-item-decrease-{productId}` | idem |
| Carrito | CartView | Eliminar | `cart-item-remove-{productId}` | idem |
| Checkout | Checkout | Sección dirección | `checkout-address-section` | `src/pages/Checkout.jsx` |
| Checkout | Checkout | Sección pago | `checkout-payment-section` | idem |
| Checkout | Checkout | Sección revisión | `checkout-review-section` | idem |
| Checkout | AddressForm | Formulario / campos / submit | `checkout-address-form`, `checkout-address-{name,line1,line2,city,state,postal-code,country,phone,reference}-input`, `checkout-address-submit-button` | `src/components/Checkout/Address/AddressForm.jsx` |
| Checkout | PaymentForm | Formulario / campos / submit | `checkout-payment-form`, `checkout-payment-{alias,card-number,holder,expiry,cvv}-input`, `checkout-payment-submit-button` | `src/components/Checkout/Payment/PaymentForm.jsx` |
| Checkout | AddressItem / PaymentItem | Seleccionar | `address-select-{id}` / `payment-select-{id}` | `.../AddressItem.jsx` / `.../PaymentItem.jsx` |
| Checkout | Checkout | Resumen / total / confirmar | `checkout-order-summary` / `checkout-total` / `checkout-confirm-button` | `src/pages/Checkout.jsx` |
| Checkout | Checkout | Errores | `checkout-address-error` / `checkout-payment-error` / `checkout-order-error` | idem |
| Confirmación | OrderConfirmation | Contenedor / número de orden | `order-success` / `order-number` | `src/pages/OrderConfirmation.jsx` |

## 16. Errores conocidos

### Defectos funcionales reales encontrados y corregidos (autorizado por el usuario)

1. **`CartView` crasheaba con ≥1 producto en el carrito.** Leía
   `cartItems`/`removeFromCart` del contexto, pero `CartContext` expone
   `items`/`removeItem`. Cualquier flujo real de carrito/checkout con
   productos fallaba con `TypeError`. **Corregido.**
2. **`CartContext.updateQuantity` no hacía `return` tras eliminar por
   cantidad &lt; 1**, ejecutando lógica adicional innecesaria después de
   remover el ítem. **Corregido** (cubierto por prueba de regresión en
   `CartContext.test.jsx`).
3. **El checkout nunca llamaba a `POST /api/orders`**: la "orden" se
   guardaba solo en `localStorage`, con `item.price` `undefined` (el shape
   real es `item.product.price`), produciendo subtotales `NaN` en la
   confirmación. **Corregido**: ahora se llama al endpoint real, se guarda el
   `_id` devuelto por el backend, y los subtotales usan el precio real del
   producto.
4. **Crear una dirección/tarjeta en checkout nunca llamaba al backend**
   (usaba IDs `Date.now().toString()` locales) — imposible construir un
   payload de orden válido (que exige `address`/`paymentMethod` como
   ObjectId real de Mongo). **Corregido**: ahora llaman a
   `POST /api/addresses` y `POST /api/payment-methods` respectivamente. Se
   agregaron los campos `state` y `phone` al formulario de dirección
   (requeridos por el modelo del backend pero ausentes del formulario
   original).

5. **Backend: el modelo `Address` no define el campo `name`**, así que la
   etiqueta que el usuario le da a una dirección ("Casa", "Oficina") se
   descarta silenciosamente al guardar (Mongoose en modo estricto). Como el
   frontend sí depende de ese campo para mostrar la dirección seleccionada,
   **corregido en el frontend**: `Checkout.jsx` ahora conserva `name` desde
   `formData` al construir la vista local en vez de confiar en que el
   backend lo devuelva. Se decidió no tocar el modelo del backend porque
   cambiar su schema está fuera del alcance de esta tarea de QA y podría
   tener otros efectos no evaluados.
6. **Backend: índice único corrupto `emai_1` (typo de `email`) en la
   colección `users` de la base de datos real usada en desarrollo**, con
   valor `null`, bloqueaba **el registro de cualquier segundo usuario**
   (`E11000 duplicate key error ... dup key: { emai: null }` en
   `logs/error.log`, con entradas desde 2026-06-11). Se descubrió al
   ejecutar el flujo de registro real contra la base de datos real de este
   equipo (ver sección de resultados de ejecución E2E manual). **Corregido**
   eliminando el índice (`db.users.dropIndex("emai_1")`) — el índice no
   está definido en `src/models/User.js`, así que no vuelve a crearse; no
   se tocó ningún dato de usuarios existentes.

### Defectos funcionales reales encontrados y **no** corregidos (fuera de alcance)

7. **`ProductCard`/`ProductDetails` leen `product.imagesUrl`**, pero el
   modelo real del backend solo tiene `imageURL` (singular) — las imágenes
   de producto nunca se muestran con datos reales del backend (caen al
   placeholder). No se corrigió por no ser bloqueante (no crashea) y estar
   fuera del alcance acordado.
8. **Backend: `PUT /api/users/:id` siempre responde 500** (
   `userController.updateUser` referencia una variable `password` nunca
   desestructurada de `req.body`). No forma parte de ningún flujo probado
   (no hay UI de edición de usuario), documentado sin corregir.
9. **Backend: script `seedProducts`** importa `../models/category.js` y
   `../models/product.js` en minúsculas, pero los archivos reales son
   `Category.js`/`Product.js` — puede fallar en sistemas de archivos
   sensibles a mayúsculas (la mayoría de runners de CI Linux). Además siembra
   `imagesUrl` (array), campo que el schema de Mongoose no define (solo
   `imageURL`), así que se descarta silenciosamente al guardar.
10. **Backend: `PaymentMethod` — validación de actualización limita
    `cardNumber` a 16 caracteres**, pero `PaymentForm` en el frontend
    solicita el número con guiones (`1234-5678-9012-3456`, 19 caracteres) —
    una edición (no una creación) de un método de pago con ese formato
    fallaría la validación. No se corrigió (no se probó ningún flujo de
    edición de pago).
11. **`Setttings.jsx`** (nombre de archivo con error tipográfico) y
    `WishList.jsx` son componentes vacíos mas sus rutas (`/settings`,
    `/wishlist`) sí están protegidas y registradas — no se agregaron pruebas
    para ellas por no tener ninguna funcionalidad implementada.

### Limitaciones del entorno de ejecución (no defectos de la app)

12. **La suite de Cypress no se pudo ejecutar en el entorno de trabajo usado
    para esta tarea.** Se comprobó (vía Bash y PowerShell, con y sin
    restricciones de sandbox, y de nuevo ya con un backend + MongoDB reales
    corriendo) que invocar `Cypress.exe` directamente devuelve la salida de
    una versión de Node.js en vez de arrancar el Test Runner — el binario de
    Cypress está siendo interceptado/redirigido por este entorno en
    particular, algo fuera del control del código del proyecto. La suite
    está completa y correctamente configurada; debe ejecutarse en una
    máquina de desarrollo normal o en un runner de CI estándar (ver sección
    de CI/CD).
13. **Verificación manual E2E realizada como alternativa a Cypress**: se
    descubrió que esta máquina sí tiene una instancia real de **MongoDB
    corriendo como servicio de Windows** en `localhost:27017` (el sondeo
    inicial con `curl http://localhost:27017` daba un falso negativo, porque
    Mongo no habla HTTP en ese puerto). Con esa base de datos real y
    `ecommerce-api`/`ecommerce-app` corriendo, se reprodujo a mano con
    `curl` exactamente la secuencia de llamadas que harían las specs de
    Cypress: `POST /auth/register` (201) → `POST /auth/login` (200, JWT
    real) → `GET /products` → `POST /addresses` (201) →
    `POST /payment-methods` (201) → `POST /orders` (201, orden persistida
    con `productId`/`address`/`paymentMethod` reales y totales correctos) →
    además `POST /auth/login` con contraseña incorrecta (400 "Invalid
    Credentials") y `POST /auth/register` con correo duplicado (400 "User
    already exist"). Todas las respuestas coinciden exactamente con lo que
    las specs de Cypress y los componentes del frontend esperan. La
    dirección y el método de pago de prueba se limpiaron después
    (`DELETE /addresses/:id`, `DELETE /payment-methods/:id`); la orden y el
    usuario de prueba no se pudieron eliminar por no existir esos endpoints
    para un usuario no-admin (limitación ya documentada en la sección 11).
14. **Se intentó primero un MongoDB en memoria (`mongodb-memory-server`)**
    para no depender de infraestructura externa, lo que llevó a descubrir
    el defecto D6 anterior (índice `emai_1` corrupto) en la base de datos
    real de este equipo — se determinó que no era necesario mantenerlo una
    vez confirmado que hay un MongoDB real disponible, así que se
    desinstaló (`npm uninstall mongodb-memory-server` en `ecommerce-api`) y
    se eliminó el script auxiliar; no queda como dependencia del proyecto.
15. Sí se verificó en este entorno, sin depender de Cypress: los **40
    tests unitarios pasan**, y **`npm run build` compila limpio** (0
    warnings/errors) tras corregir varios `no-unused-vars` preexistentes que
    hacían fallar el build en modo `CI=true` (ver "Archivos modificados" en
    el informe final) — estos no estaban relacionados con las pruebas, pero
    bloqueaban el paso de `build` de cualquier pipeline de CI y se
    corrigieron por ser trivialmente seguros (imports/variables sin usar).
16. **`react-router-dom` 7.15.0 (resuelto por npm bajo el rango `^7.9.4`)
    tiene un `package.json` con el campo `main` apuntando a
    `dist/main.js`, archivo que no existe en el paquete publicado** (solo
    existen `dist/index.js`/`dist/index.mjs`). Jest (vía `react-scripts`
    5, que usa una versión de `jest-resolve` sin soporte completo del campo
    `exports`) no podía resolver el paquete en absoluto. Se solucionó con un
    `moduleNameMapper` en la clave `"jest"` de `package.json` que apunta
    directamente a los archivos `dist/*.js` reales — es una corrección de
    infraestructura de pruebas únicamente (no afecta el build de producción
    con Webpack, que sí soporta `exports` correctamente).

## 17. Recomendaciones para CI/CD

Ver `.github/workflows/ci.yml` (agregado en este trabajo, no existía
ningún workflow previo en el repo). Resumen del pipeline:

1. Checkout + instalación de dependencias (`npm ci`) en ambos subproyectos.
2. Lint + build (`npm run build`, con `CI=true` para que los warnings
   rompan el pipeline).
3. Pruebas unitarias con cobertura (`npm run test:coverage`).
4. Arranque de un servicio MongoDB real (contenedor de servicio de GitHub
   Actions) + `ecommerce-api` + seed de productos.
5. Arranque de `ecommerce-app` y ejecución de Cypress en modo headless
   (`start-server-and-test`), con videos/screenshots subidos como artefacto
   solo si hay fallos.

El pipeline está escrito para fallar duro ante cualquier error (no usa
`|| true` en ningún paso) — no se pudo *ejecutar* este workflow dentro de
esta sesión de trabajo (no hay acceso a Actions desde aquí), así que
recomienda revisarlo en la primera ejecución real en GitHub.
