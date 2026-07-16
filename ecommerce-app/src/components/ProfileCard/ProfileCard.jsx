
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import "./ProfileCard.css";

const ROLE_COLORS = {
  admin: "#2563eb",
  customer: "#22c55e",
};

function buildRoleActions(navigate) {
  return {
    admin: [
      { label: "Editar Perfil", action: () => navigate("/profile/edit") },
      { label: "Cambiar contraseña", action: () => navigate("/profile/change-password") },
      { label: "Ver todos los pedidos", action: () => navigate("/orders") },
      { label: "Panel de administración", action: () => navigate("/admin/products") },
    ],
    customer: [
      { label: "Editar Perfil", action: () => navigate("/profile/edit") },
      { label: "Cambiar contraseña", action: () => navigate("/profile/change-password") },
      { label: "Ver mis pedidos", action: () => navigate("/orders") },
    ],
  };
}

export default function ProfileCard({ user: userProp }) {
  const {user: contextUser} = useAuth();
  const navigate = useNavigate();
  const currentUser = userProp || contextUser;

  const role = currentUser.role || "guest";
  const actions = buildRoleActions(navigate)[role] || [];

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
            width="96"
            height="96"
            decoding="async"
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
