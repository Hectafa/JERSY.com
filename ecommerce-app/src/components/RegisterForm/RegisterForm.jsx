import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../services/authService";
import Button from "../common/Button";
import ErrorMessage from "../common/ErrorMessage/ErrorMessage";
import Input from "../common/Input";
import RegisterErrorMessage from "../RegisterErrorMessage/RegisterErrorMessage";
import "./RegisterForm.css";

export default function RegisterForm() {
  const navigate = useNavigate();

  // Estado para los campos de formulario
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

    // Limpiar error de ese campo si lo había
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = (form) => {
    const errors = {};

    // Nombre
    if (!form.name.trim()) {
      errors.name = "El nombre es requerido";
    } else if (form.name.trim().length < 2) {
      errors.name = "El nombre debe de tener al menos dos caracteres";
    }

    // Email
    if (!form.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "El email no tiene un formato válido";
    }

    // Password
    if (!form.password.trim()) {
      errors.password = "El password es requerido";
    } else if (form.password.trim().length < 6) {
      errors.password = "El password debe de tener al menos 6 caracteres";
    }

    // Confirm Password
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (form.phone && !/^[\d\s+()-]{7,}$/.test(form.phone)) {
      errors.phone = "El teléfono no tiene un formato válido";
    }

    return errors;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const errors = validate(form);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setErrorKind(null);
    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      navigate("/login", {
        state: { justRegistered: true, email: form.email },
      });
    } catch (err) {
      handleRegisterError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterError = (err) => {
    const kind = err.kind || "UNKNOWN";

    if (kind === "CLIENT_ERROR" && err.status === 400) {
      const backendMessage = err.original?.response?.data?.message;
      if (backendMessage === "User already exist") {
        setFieldErrors({ email: "Este email ya está registrado" });
        return;
      }
      setErrorKind("BAD_REQUEST");
      return;
    }

    if (kind === "VALIDATION" && err.fields) {
      const fieldErrors = {};
      err.fields.forEach((f) => {
        fieldErrors[f.path || f.param] = f.msg;
      });
      setFieldErrors(fieldErrors);
      return;
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Crear cuenta</h2>

        <form className="register-form" onSubmit={onSubmit} noValidate>
          <div className="form-group">
            <Input
              id="name"
              label="Nombre completo *"
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Tu nombre"
            />
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <Input
              id="email"
              label="Email *"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="tu@email.com"
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <Input
              id="password"
              label="Contraseña *"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Mínimo 6 caracteres"
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <Input
              id="confirmPassword"
              label="Confirmar contraseña *"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              placeholder="Repite la contraseña"
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <div className="form-group">
            <Input
              id="phone"
              label="Teléfono (opcional)"
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="+52 55 1234 5678"
            />
            {fieldErrors.phone && (
              <span className="field-error">{fieldErrors.phone}</span>
            )}
          </div>

          {errorKind && <RegisterErrorMessage kind={errorKind} />}

          <Button disabled={loading} type="submit" variant="primary">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <div className="register-footer">
          <span>¿Ya tienes cuenta?</span>
          <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
