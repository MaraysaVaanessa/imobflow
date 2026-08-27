import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "components/auth/RequireAuth";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import TermsOfUse from "views/legal/TermsOfUse";
import PrivacyPolicy from "views/legal/PrivacyPolicy";
import Support from "views/legal/Support";
import OwnerLogin from "views/ownerPortal/Login";
import OwnerChangePassword from "views/ownerPortal/ChangePassword";
import OwnerDashboard from "views/ownerPortal/Dashboard";
import TenantLogin from "views/tenantPortal/Login";
import TenantChangePassword from "views/tenantPortal/ChangePassword";
import TenantDashboard from "views/tenantPortal/Dashboard";
import AccessHub from "views/access/AccessHub";

const App = () => {
  return (
    <Routes>
      <Route path="auth/*" element={<AuthLayout />} />
      <Route
        path="admin/*"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      />
      <Route path="rtl/*" element={<RtlLayout />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/support" element={<Support />} />
      <Route path="/portal-proprietario/login" element={<OwnerLogin />} />
      <Route
        path="/portal-proprietario/trocar-senha"
        element={<OwnerChangePassword />}
      />
      <Route
        path="/portal-proprietario/dashboard"
        element={<OwnerDashboard />}
      />
      <Route path="/portal-inquilino/login" element={<TenantLogin />} />
      <Route
        path="/portal-inquilino/trocar-senha"
        element={<TenantChangePassword />}
      />
      <Route path="/portal-inquilino/dashboard" element={<TenantDashboard />} />
      <Route path="/acesso" element={<AccessHub />} />
      <Route path="/" element={<Navigate to="/acesso" replace />} />
    </Routes>
  );
};

export default App;
