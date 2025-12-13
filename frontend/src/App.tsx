import { Routes, Route } from "react-router-dom";

import { Layout } from "./components/layout/Layout";
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { PublishersPage } from "./pages/PublishersPage";
import { PublisherDetailPage } from "./pages/PublisherDetailPage";
import { SystemsPage } from "./pages/SystemsPage";
import { SystemDetailPage } from "./pages/SystemDetailPage";
import { SearchPage } from "./pages/SearchPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/publishers" element={<PublishersPage />} />
        <Route path="/publishers/:slug" element={<PublisherDetailPage />} />
        <Route path="/systems" element={<SystemsPage />} />
        <Route path="/systems/:slug" element={<SystemDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
