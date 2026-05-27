import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Input from "../common/Input";
import "./LoginForm.css";
import RegisterErrorMessage from "../RegisterErrorMessage/RegisterErrorMessage";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const justRegistered = location.state?.justRegistered;
  const prefilledEmail = location.state?.email ?? "";
  const from = location.state?.from || "/";

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorKind(null);
    setErrorMessage("");

    try {
      await login({ email, password });
      navigate(from);
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (err) => {
    const kind = err.kind || "UNKNOWN";
    if (kind === "CLIENT_ERROR" && err.status === 400) {
      const msg = err.original?.response?.data?.message;
      setErrorMessage(
        msg === "Invalid Credentials"
          ? "Email o contraseña incorrectos."
          : "Usuario no registrado. ¿Quieres crear una cuenta?",
      );
      return;
    }
    setErrorKind(kind);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>
        {justRegistered && (
          <div className="success-message">
            Cuenta creada exitosamente. Inicia sesión con tu email y contraseña
          </div>
        )}
        <form className="login-form" onSubmit={onSubmit}>
          <div className="form-group">
            <Input
              id="email"
              label="Email: "
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="form-group">
            <Input
              id="password"
              label="Contraseña: "
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          {errorKind && <RegisterErrorMessage kind={errorKind} />}

          <Button disabled={loading} type="submit" variant="primary">
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>
        <div className="login-footer">
          <span>¿No tienes cuenta?</span>
          <Link to="/register">Regístrate</Link>
        </div>
      </div>
    </div>
  );
}