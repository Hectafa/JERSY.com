import "./Loading.css";

export default function Loading({children}) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" aria-label="Cargando" />
      <span className="loading-text">{children}</span>
    </div>
  );
}