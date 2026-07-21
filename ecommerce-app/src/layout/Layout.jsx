import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
