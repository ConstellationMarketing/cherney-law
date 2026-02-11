import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Lazy load admin components from cms-core submodule
// This prevents the route scanner from following these imports at build time
const AdminLayout = lazy(
  () => import("../../vendor/cms-core/client/components/admin/AdminLayout"),
);
const AdminLogin = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminLogin"),
);
const AdminDashboard = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminDashboard"),
);
const AdminPages = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminPages"),
);
const AdminPageNew = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminPageNew"),
);
const AdminPageEdit = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminPageEdit"),
);
const AdminRedirects = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminRedirects"),
);
const AdminTemplates = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminTemplates"),
);
const AdminMediaLibrary = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminMediaLibrary"),
);
const AdminUsers = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminUsers"),
);
const AdminSiteSettings = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminSiteSettings"),
);
const AdminSearchReplace = lazy(
  () => import("../../vendor/cms-core/client/pages/admin/AdminSearchReplace"),
);

// Loading fallback for admin pages
function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        <p className="text-gray-600 text-sm">Loading admin...</p>
      </div>
    </div>
  );
}

/**
 * Admin Routes Configuration
 *
 * - Login page is rendered WITHOUT the AdminLayout (no sidebar)
 * - All other admin pages are wrapped in AdminLayout which provides:
 *   - Sidebar navigation
 *   - Authentication checking (redirects to login if not authenticated)
 *   - Consistent layout structure
 *
 * NOTE: All admin components are lazy-loaded to improve route detection
 * performance and reduce initial bundle size.
 */
export default function AdminRoutes() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Routes>
        {/* Login stays OUTSIDE the layout - no sidebar on login page */}
        <Route path="login" element={<AdminLogin />} />

        {/* All protected routes wrapped in AdminLayout */}
        <Route element={<AdminLayout />}>
          {/* Default /admin -> /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          {/* Page management */}
          <Route path="pages" element={<AdminPages />} />
          <Route path="pages/new" element={<AdminPageNew />} />
          <Route path="pages/:id" element={<AdminPageEdit />} />

          {/* Content & media */}
          <Route path="media" element={<AdminMediaLibrary />} />
          <Route path="search-replace" element={<AdminSearchReplace />} />

          {/* Site configuration */}
          <Route path="site-settings" element={<AdminSiteSettings />} />
          <Route path="redirects" element={<AdminRedirects />} />
          <Route path="templates" element={<AdminTemplates />} />

          {/* User management */}
          <Route path="users" element={<AdminUsers />} />

          {/* Catch-all inside /admin */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
