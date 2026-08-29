# JERSY.com

E-commerce de venta de jerseys/playeras de fútbol soccer. Monorepo con backend (API) y frontend (SPA), pensado para desplegarse como tres piezas independientes: API en Render, frontend en Vercel y base de datos en MongoDB Atlas.

> **Estado del despliegue:** actualmente no hay demo pública — las instancias en Vercel, Render y el cluster de MongoDB Atlas fueron dadas de baja y se volverán a desplegar más adelante. Todo el proyecto corre localmente siguiendo esta guía.

## Estructura

```
JERSY.com/
├── ecommerce-api/     # backend: Node.js + Express 5 + MongoDB (Mongoose)
├── ecommerce-app/      # frontend: React 19 + React Router 7
├── docs/                # documentación de testing y arquitectura
└── render.yaml          # blueprint de despliegue del backend en Render
```

## `ecommerce-api` (backend)

API REST con autenticación JWT (access + refresh token), catálogo de productos con categorías/subcategorías y control de tallas/stock, carrito, direcciones, métodos de pago, órdenes y panel de administración.

- **Stack:** Express 5, Mongoose 9, JWT (`jsonwebtoken`), `bcrypt`, `multer` (subida de imágenes/avatares), `express-validator`.
- **Tests:** Vitest (unitarios + integración con `mongodb-memory-server`, más de 100 tests) y pruebas de carga con Artillery.

### Variables de entorno (`ecommerce-api/.env`)

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (por defecto libre según tu shell/`server.js`) |
| `MONGODB_URI` | Connection string de MongoDB (local o Atlas) |
| `JWT_SECRET` | Secreto para firmar el access token |
| `JWT_REFRESH_TOKEN` | Secreto para firmar el refresh token |
| `JWT_EXPIRES_IN` | Vigencia del access token (ej. `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | Vigencia del refresh token (ej. `12h`) |
| `CORS_ORIGIN` | Origen(es) permitidos, separados por coma (URL del frontend) |

No existe `.env.example` en el repo — crea `ecommerce-api/.env` a mano con las claves de arriba.

### Correr el backend

```bash
cd ecommerce-api
npm install
npm start          # producción: node server.js
npm run dev         # desarrollo con nodemon
```

### Tests del backend

```bash
cd ecommerce-api
npm test                  # vitest run (todo)
npm run test:unit
npm run test:integration
npm run test:coverage
npm run test:load          # pruebas de carga con Artillery (tests/load/eshop-load.yml)
```

## `ecommerce-app` (frontend)

SPA en React con catálogo, carrito, checkout, historial de pedidos, wishlist y panel de administración (categorías, productos, pedidos).

- **Stack:** React 19, React Router 7, Axios, Create React App (`react-scripts`).
- **Tests:** Jest + React Testing Library (unitarios/integración) y Cypress (E2E).

### Variables de entorno (`ecommerce-app/.env`)

| Variable | Descripción |
|---|---|
| `REACT_APP_API_URL` | URL base de la API (por defecto `http://localhost:4000/api` si no se define) |

### Correr el frontend

```bash
cd ecommerce-app
npm install
npm start           # http://localhost:3000
npm run build        # build de producción
```

### Tests del frontend

```bash
cd ecommerce-app
npm run test:run           # unitarios, una sola corrida
npm run test:coverage       # con cobertura

# E2E (requiere el backend + MongoDB corriendo en paralelo)
npm run cypress:open        # modo interactivo
npm run cypress:run         # headless
npm run test:e2e:ci         # levanta el frontend automáticamente y corre Cypress
```

Detalle completo de la estrategia de pruebas, `data-testid` usados y defectos conocidos: [`docs/testing.md`](docs/testing.md) y [`docs/testing/test-matrix.md`](docs/testing/test-matrix.md).

## Correr el proyecto completo en local

Necesitas MongoDB accesible (local o Atlas) y dos terminales:

```bash
# Terminal 1 — backend
cd ecommerce-api
npm install
# crear .env con las variables de la tabla de arriba
npm run dev              # http://localhost:4000

# Terminal 2 — frontend
cd ecommerce-app
npm install
# opcional: .env con REACT_APP_API_URL si el backend no está en localhost:4000
npm start                 # http://localhost:3000
```

No hay script de seed de productos en el repo actualmente — el catálogo se puebla creando productos vía el panel de administración una vez tengas un usuario admin.

## Despliegue

- **Backend → Render:** blueprint en [`render.yaml`](render.yaml) (`New > Blueprint` en Render, apuntando a este repo). Pide `MONGODB_URI` y `CORS_ORIGIN` al crear el servicio; el resto de variables JWT se generan automáticamente.
- **Frontend → Vercel:** desplegar `ecommerce-app/` como proyecto, configurando `REACT_APP_API_URL` apuntando a la URL del backend en Render.
- **Base de datos → MongoDB Atlas:** cluster gestionado; el connection string va en `MONGODB_URI`.

Ninguna de las tres piezas está desplegada actualmente (ver nota al inicio de este README).

## CI

Pipeline en [`.github/workflows/ci.yml`](.github/workflows/ci.yml): instala dependencias, build, tests unitarios con cobertura en ambos subproyectos, levanta MongoDB de servicio + backend, y corre Cypress en modo headless.
