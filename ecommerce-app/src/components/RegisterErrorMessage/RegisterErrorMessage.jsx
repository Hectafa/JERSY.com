import ErrorMessage from "../common/ErrorMessage/ErrorMessage";

export default function RegisterErrorMessage({ kind }) {
  if (kind === "NETWORK" || kind === "TIMEOUT") {
    return (
      <ErrorMessage data-testid="form-error-network">
        No pudimos conectar con el servidor. Revisa tu conexión a internet.
      </ErrorMessage>
    );
  }

  if (kind === "SERVER_ERROR") {
    return (
      <ErrorMessage data-testid="form-error-server">
        Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos.
      </ErrorMessage>
    );
  }

  if (kind === "BAD_REQUEST") {
    return (
      <ErrorMessage data-testid="form-error-bad-request">
        Los datos enviados no son válidos. Revisa los campos.
      </ErrorMessage>
    );
  }

  // FALLBACK
  return (
    <ErrorMessage data-testid="form-error-unknown">
      Ocurrió un error inesperado al ejecutar tu petición. No es necesario
      reportarlo; intenta de nuevo mas tarde.{" "}
    </ErrorMessage>
  );
}
