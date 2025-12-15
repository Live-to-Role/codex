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
import { ProfilePage } from "./pages/ProfilePage";
import { AuthorDetailPage } from "./pages/AuthorDetailPage";
import { ProductEditPage } from "./pages/ProductEditPage";
import { ModerationPage } from "./pages/ModerationPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { SeriesPage } from "./pages/SeriesPage";
import { SeriesDetailPage } from "./pages/SeriesDetailPage";
import { PublisherDashboardPage } from "./pages/PublisherDashboardPage";
import { ContributionSuccessPage } from "./pages/ContributionSuccessPage";
import { ProductCreatePage } from "./pages/ProductCreatePage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { MyRunsPage } from "./pages/MyRunsPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductCreatePage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/products/:slug/edit" element={<ProductEditPage />} />
        <Route path="/contribution/success" element={<ContributionSuccessPage />} />
        <Route path="/publishers" element={<PublishersPage />} />
        <Route path="/publishers/:slug" element={<PublisherDetailPage />} />
        <Route path="/systems" element={<SystemsPage />} />
        <Route path="/systems/:slug" element={<SystemDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:key" element={<VerifyEmailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/authors/:slug" element={<AuthorDetailPage />} />
        <Route path="/moderation" element={<ModerationPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/series/:slug" element={<SeriesDetailPage />} />
        <Route path="/dashboard" element={<PublisherDashboardPage />} />
        <Route path="/my-runs" element={<MyRunsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
