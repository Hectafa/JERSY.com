import { getCurrentUser } from "../../utils/auth";
import Button from "../common/Button";
import "./ProfileCard.css";

const ROLE_COLORS = {
  admin: "#2563eb",
  customer: "#22c55e",
};

const ROLE_ACTIONS = {
  admin: [
    { label: "Editar Perfil", action: () => {} },
    { label: "Cambiar contraseña", action: () => {} },
    { label: "Ver todos los pedidos", action: () => {} },
    { label: "Panel de administración", action: () => {} },
  ],
  customer: [
    { label: "Editar Perfil", action: () => {} },
    { label: "Cambiar contraseña", action: () => {} },
    { label: "Ver mis pedidos", action: () => {} },
  ],
};

export default function ProfileCard({ user }) {
  const currentUser = user || getCurrentUser();
  const role = currentUser.role || "guest";
  const actions = ROLE_ACTIONS[role] || [];

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <img
            src={currentUser.avatar || "/img/user-placeholder.png"}
            alt={
              currentUser.displayName || currentUser.name || currentUser.email
            }
            className="profile-avatar"
          />
          <div className="profile-names">
            <h2>
              {currentUser.displayName || currentUser.name || currentUser.email}
            </h2>
            <span
              className="profile-role-badge"
              style={{ background: ROLE_COLORS[role] }}
            >
              {role}
            </span>
          </div>
        </div>
        <div className="profile-info">
          <div className="info-item">
            <label>Email:</label>
            <span>{currentUser.email || "No disponible"}</span>
          </div>
          <div className="info-item">
            <label>Nombre:</label>
            <span>
              {currentUser.displayName || currentUser.name || "No disponible"}
            </span>
          </div>
          <div className="info-item">
            <label>Estado:</label>
            <span>{currentUser.isActive ? "Activo" : "Inactivo"}</span>
          </div>
          <div className="info-item">
            <label>Última conexión:</label>
            <span>
              {currentUser.loginDate
                ? new Date(currentUser.loginDate).toLocaleString()
                : "No disponible"}
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <h3>Acciones de la cuenta</h3>
          {actions.map((action, idx) => (
            <Button key={idx} type="button" onClick={action.action}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
