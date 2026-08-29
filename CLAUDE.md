# JERSY.com

E-commerce de venta de jerseys/playeras de fútbol soccer. Monorepo: backend (`ecommerce-api/`) + frontend (`ecommerce-app/`). Ver [README.md](README.md) para la guía completa de instalación, variables de entorno y despliegue.

## Estructura

- `ecommerce-api/` — backend Node/Express 5 + MongoDB (Mongoose). Auth JWT (access + refresh), catálogo con categorías/tallas/stock, carrito, direcciones, métodos de pago, órdenes, panel admin. Tests con Vitest.
  - Arrancar: `cd ecommerce-api && npm install && npm run dev`
- `ecommerce-app/` — frontend React 19 + React Router 7. Catálogo, carrito, checkout, historial de pedidos, wishlist, panel admin. Tests con Jest/RTL + Cypress E2E.
  - Arrancar: `cd ecommerce-app && npm install && npm start`
- `docs/testing.md` y `docs/testing/test-matrix.md` — estrategia de pruebas y matriz de cobertura por feature, mantenida al día; consultar antes de tocar tests.
- `docs/architecture/` — diagrama de arquitectura (HTML/JSON).

## Estado de despliegue

Sin demo pública por ahora: las instancias de Vercel (frontend), Render (backend, ver `render.yaml`) y el cluster de MongoDB Atlas fueron dadas de baja y se volverán a desplegar más adelante. Todo el desarrollo/pruebas corre en local.

## Notas

- Cada subproyecto tiene su propio `package.json` y `node_modules` (no compartidos).
- `node_modules/` y archivos `.env` están ignorados vía `.gitignore`. No hay `.env.example` en el repo — las variables requeridas están documentadas en el README.
- No existe script de seed de productos en el repo actual (el catálogo se puebla vía panel admin).
