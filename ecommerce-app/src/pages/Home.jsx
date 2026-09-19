import { useQuery } from "@tanstack/react-query";
import BannerCarousel from "../components/BannerCarousel";
import List from "../components/List/List";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import homeImages from "../data/homeImages.json";
import { getAllProducts } from "../services/productsService";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products", "all"],
    queryFn: getAllProducts,
  });

  const products = data?.products ?? [];
  const errorKind = error?.kind || (error ? "UNKNOWN" : null);

  return (
    <div>
      <BannerCarousel banners={homeImages} />
      {isLoading && <Loading>Cargando productos...</Loading>}
      {!isLoading && errorKind && errorKind === "NETWORK" && (
        <ErrorMessage>
          No pudimos conectar. Revisa tu conexión a internet
        </ErrorMessage>
      )}
      {!isLoading && errorKind && errorKind === "SERVER_ERROR" && (
        <ErrorMessage>Algo salió mal. Intenta mas tarde.</ErrorMessage>
      )}
      {!isLoading && errorKind && errorKind !== "NETWORK" && errorKind !== "SERVER_ERROR" && (
        <ErrorMessage>Ocurrió un error inesperado.{errorKind}</ErrorMessage>
      )}
      {!isLoading && !errorKind && products.length === 0 && (
        <ErrorMessage>No hay productos en el catálogo.</ErrorMessage>
      )}
      {!isLoading && !errorKind && products.length > 0 && (
        <List
          title="Productos recomendados"
          products={products}
          layout="grid"
        />
      )}
    </div>
  );
}
