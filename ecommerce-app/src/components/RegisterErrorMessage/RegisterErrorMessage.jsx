import ErrorMessage from "../common/ErrorMessage/ErrorMessage";

export default function RegisterErrorMessage({ kind }) {
  if (kind === "NETWORK" || kind === "TIMEOUT") {
    return (
      <ErrorMessage>
        No pudimos conectar con el servidor. Revisa tu conexión a internet.
      </ErrorMessage>
    );
  }

  if (kind === "SERVER_ERROR") {
    return (
      <ErrorMessage>
        Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos.
      </ErrorMessage>
    );
  }

  if (kind === "BAD_REQUEST") {
    return (
      <ErrorMessage>
        Los datos enviados no son válidos. Revisa los campos.
      </ErrorMessage>
    );
  }

  // FALLBACK
  return (
    <ErrorMessage>
      Ocurrió un error inesperado al ejecutar tu petición. No es necesario
      reportarlo; intenta de nuevo mas tarde.{" "}
    </ErrorMessage>
  );
}
