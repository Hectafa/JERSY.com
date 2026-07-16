import { useEffect, useState } from "react";
import ProductForm from "../components/Admin/ProductForm";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { getAllCategories } from "../services/categoryService";
import {
  createProduct,
  deleteProduct,
  searchProducts,
  updateProduct,
} from "../services/productsService";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = async () => {
    const { products: results } = await searchProducts({ limit: 100 });
    setProducts(results || []);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [, categoryList] = await Promise.all([
          loadProducts(),
          getAllCategories(),
        ]);
        setCategories(categoryList || []);
      } catch (err) {
        setError("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleNew = () => {
    setEditingProduct(null);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setEditingProduct({
      ...product,
      category: product.category?._id || "",
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (formData) => {
    setFormError(null);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, formData);
      } else {
        await createProduct(formData);
      }
      await loadProducts();
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
      await loadProducts();
    } catch (err) {
      setError("No se pudo eliminar el producto.");
    }
  };

  if (loading) return <Loading>Cargando productos...</Loading>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <div className="admin-products-container" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 className="h1">Administrar productos</h1>
        {!showForm && (
          <Button variant="primary" onClick={handleNew}>
            Nuevo producto
          </Button>
        )}
      </div>

      {showForm ? (
        <>
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            categories={categories}
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
