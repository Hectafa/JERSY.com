const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      on("task", {
        log(message) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },
      });

      // Permite sobreescribir la URL del API y credenciales de prueba desde
      // variables de entorno del sistema (útil en CI) sin comitear secretos.
      config.env.apiUrl = process.env.CYPRESS_API_URL || config.env.apiUrl;
      config.env.TEST_USER_EMAIL =
        process.env.CYPRESS_TEST_USER_EMAIL || config.env.TEST_USER_EMAIL;
      config.env.TEST_USER_PASSWORD =
        process.env.CYPRESS_TEST_USER_PASSWORD ||
        config.env.TEST_USER_PASSWORD;

      return config;
    },
  },
  env: {
    apiUrl: "http://localhost:4000/api",
    TEST_USER_EMAIL: "",
    TEST_USER_PASSWORD: "",
  },
});
