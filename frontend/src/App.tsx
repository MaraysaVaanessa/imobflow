import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "components/auth/RequireAuth";

import RtlLayout from "layouts/rtl";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import TermsOfUse from "views/legal/TermsOfUse";
import PrivacyPolicy from "views/legal/PrivacyPolicy";
import Support from "views/legal/Support";

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
      <Route path="/" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default App;
