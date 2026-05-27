# 2026-2-ReactFS

Monorepo del curso React Full-Stack 2026-2.

## Estructura

- `ecommerce-api/` — backend Node/Express.
  - Arrancar: `cd ecommerce-api && npm install && npm start`
- `ecommerce-app/` — frontend React.
  - Arrancar: `cd ecommerce-app && npm install && npm start`

## Notas

- Cada subproyecto tiene su propio `package.json` y `node_modules` (no compartidos).
- `node_modules/` y archivos `.env` estan ignorados via `.gitignore`.
