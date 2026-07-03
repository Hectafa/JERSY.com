import "./commands";

// Falla la prueba si la app lanza un error de JavaScript no controlado en
// el navegador (p.ej. el bug conocido de CartView antes de la corrección),
// salvo por el ResizeObserver benigno que algunos navegadores emiten.
Cypress.on("uncaught:exception", (err) => {
  if (/ResizeObserver loop/i.test(err.message)) {
    return false;
  }
  return true;
});
