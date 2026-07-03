import { useEffect, useState } from "react";
import BannerCarousel from "../components/BannerCarousel";
import List from "../components/List/List";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import homeImages from "../data/homeImages.json";
import { getAllProducts } from "../services/productsService";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setPagination] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllProducts();
        if (cancelled) return;
        setProducts(data.products);
        setPagination(data.pagination);
      } catch (err) {
        if (!cancelled) setError(err.kind || "UNKNOWN");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <BannerCarousel banners={homeImages} />
      {loading && <Loading>Cargando productos...</Loading>}
      {!loading && error && error === "NETWORK" && (
        <ErrorMessage>
          No pudimos conectar. Revisa tu conexión a internet
        </ErrorMessage>
      )}
      {!loading && error && error === "SERVER_ERROR" && (
        <ErrorMessage>Algo salió mal. Intenta mas tarde.</ErrorMessage>
      )}
      {!loading && error && error !== "NETWORK" && error !== "SERVER_ERROR" && (
        <ErrorMessage>Ocurrió un error inesperado.{error}</ErrorMessage>
      )}
      {!loading && !error && products.length === 0 && (
        <ErrorMessage>No hay productos en el catálogo.</ErrorMessage>
      )}
      {!loading && !error && products.length > 0 && (
        <List
          title="Productos recomendados"
          products={products}
          layout="grid"
        />
      )}
    </div>
  );
}
