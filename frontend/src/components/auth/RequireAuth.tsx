import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return children;
};

export default RequireAuth;
