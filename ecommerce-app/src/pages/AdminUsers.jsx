import { useState, useEffect } from "react";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { getAllUsers } from "../services/userService";

const formatDate = (isoString) => {
    if (!isoString) return "Fecha desconocida";
    try {
        return new Date(isoString).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch (error) {
        return "Fecha invalida";
    }
};

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            try {
                setLoading(true);
                setError(null);
                const results = await getAllUsers();
                if(!cancelled) setUsers(results || []);
            } catch (err) {
                if (!cancelled) setError("No se puedieron cargar los usuarios.");
            } finally {
                if(!cancelled) setLoading(false);
            }
        }

        loadUsers();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <Loading>Cargando usuarios...</Loading>;
    if (error) return <ErrorMessage>{error}</ErrorMessage>;

    return (
        <div className="admin-users-container" style={{padding: "24px"}}>
            <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
            }}
        >
            <h1 className="h1">Usuarios registrados</h1>
            <span>{users.length}</span>
        </div>

        <table className="admin-users-table" style={{width: "100%", borderCollapse: "collapse"}}>
            <thead>
                <tr>
                    <th style={{textAlign: "left"}}>Nombre</th>
                    <th style={{textAlign: "left"}}>Email</th>
                    <th style={{textAlign: "left"}}>Fecha de registro</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => (
                    <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{formatDate(user.createdAt)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}