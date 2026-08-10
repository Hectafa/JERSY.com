import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductForm from "../components/Admin/ProductForm";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import {
  getAllCategories,
  getCategoryById,
  getProductsByCategoryAndChildren,
} from "../services/categoryService";
import { createProduct, deleteProduct, updateProduct } from "../services/productsService";

export default function AdminProducts() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadData = async () => {
    const [categoryData, allCategories] = await Promise.all([
      getCategoryById(categoryId),
      getAllCategories(),
    ]);
    setCategory(categoryData);

    const subs = (allCategories || []).filter(
      (c) => c.parentCategory?._id === categoryId,
    );
    setSubcategories(subs);

    if (subs.length > 0) {
      setProducts([]);
      return;
    }

    const productsData = await getProductsByCategoryAndChildren(categoryId, {
      limit: 100,
    });
    setProducts(productsData.products || []);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [categoryData, allCategories] = await Promise.all([
          getCategoryById(categoryId),
          getAllCategories(),
        ]);
        if (cancelled) return;
        setCategory(categoryData);

        const subs = (allCategories || []).filter(
          (c) => c.parentCategory?._id === categoryId,
        );
        setSubcategories(subs);

        if (subs.length > 0) {
          setProducts([]);
          return;
        }

        const productsData = await getProductsByCategoryAndChildren(categoryId, {
          limit: 100,
        });
        if (cancelled) return;
        setProducts(productsData.products || []);
      } catch (err) {
        if (!cancelled) setError("No se pudieron cargar los productos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const handleNew = () => {
    setEditingProduct(null);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormError(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (formData) => {
    setFormError(null);
    const payload = { ...formData, category: categoryId };
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
      } else {
        await createProduct(payload);
      }
      await loadData();
      setShowForm(false);
      setEditingProduct(null);
    } catch (err) {
      setFormError("No se pudo guardar el producto. Verifica los datos.");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`¿Eliminar "${product.name}"?`);
    if (!confirmed) return;
    try {
      await deleteProduct(product._id);
      await loadData();
    } catch (err) {
      setError("No se pudo eliminar el producto.");
    }
  };

  if (loading) return <Loading>Cargando...</Loading>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  const isSubcategoryPicker = subcategories.length > 0;

  return (
    <div className="admin-products-container" style={{ padding: "24px" }}>
      <Link to="/admin/products">← Categorías</Link>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "8px",
          marginBottom: "16px",
        }}
      >
        <h1 className="h1">Administrar categoría — {category?.name}</h1>
        {!isSubcategoryPicker && !showForm && (
          <Button variant="primary" onClick={handleNew}>
            Nuevo producto
          </Button>
        )}
      </div>

      {isSubcategoryPicker ? (
        <ul className="admin-categories-list" style={{ listStyle: "none", padding: 0 }}>
          {subcategories.map((sub) => (
            <li key={sub._id} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong>{sub.name}</strong>
                <Button size="sm" onClick={() => navigate(`/admin/products/${sub._id}`)}>
                  Administrar categoría {sub.name}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : showForm ? (
        <>
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialValues={editingProduct || {}}
            isEdit={!!editingProduct}
          />
        </>
      ) : (
        <table className="admin-products-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Nombre</th>
              <th style={{ textAlign: "left" }}>Categoría</th>
              <th style={{ textAlign: "right" }}>Precio</th>
              <th style={{ textAlign: "right" }}>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.category?.name || "Sin categoría"}</td>
                <td style={{ textAlign: "right" }}>${product.price}</td>
                <td style={{ textAlign: "right" }}>{product.stock}</td>
                <td style={{ display: "flex", gap: "8px" }}>
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(product)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(product)}>
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
