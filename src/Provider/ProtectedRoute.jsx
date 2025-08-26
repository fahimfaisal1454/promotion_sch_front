import { Navigate } from "react-router-dom";
import { useUser } from "./UseProvider";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useUser();

  // ⛔ If no user, redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ If allowedRoles is provided, check against it
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Otherwise show the page
  return children;
};

export default ProtectedRoute;
