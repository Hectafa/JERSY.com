import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { createCategory, getAllCategories } from "../services/categoryService";

const emptyForm = { name: "", parentCategory: "" };

export default function AdminCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    const results = await getAllCategories();
    setCategories(results || []);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const results = await getAllCategories();
        if (!cancelled) setCategories(results || []);
      } catch (err) {
        if (!cancelled) setError("No se pudieron cargar las categorías.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const rootCategories = categories.filter((c) => !c.parentCategory);

  const handleNew = () => {
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(emptyForm);
    setFormError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = { name: formData.name.trim() };
      if (formData.parentCategory) {
        payload.parentCategory = formData.parentCategory;
      }
      await createCategory(payload);
      await loadCategories();
      setShowForm(false);
      setFormData(emptyForm);
    } catch (err) {
      setFormError("No se pudo crear la categoría.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading>Cargando categorías...</Loading>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <div className="admin-categories-container" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 className="h1">Administrar categorías</h1>
        {!showForm && (
          <Button variant="primary" onClick={handleNew}>
            Nueva categoría
          </Button>
        )}
      </div>

      {showForm && (
        <form
          className="admin-category-form"
          onSubmit={handleSubmit}
          style={{ marginBottom: "24px" }}
        >
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          <Input
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <div className="input-group">
            <label htmlFor="parentCategory" className="input-label">
              Es subcategoría de
            </label>
            <select
              id="parentCategory"
              name="parentCategory"
              className="input-field"
              value={formData.parentCategory}
              onChange={handleChange}
            >
              <option value="">Ninguna (categoría raíz)</option>
              {rootCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? "Creando..." : "Crear categoría"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <ul className="admin-categories-list" style={{ listStyle: "none", padding: 0 }}>
        {rootCategories.map((cat) => (
          <li key={cat._id} style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong>{cat.name}</strong>
              <Button size="sm" onClick={() => navigate(`/admin/products/${cat._id}`)}>
                Administrar categoría {cat.name}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
