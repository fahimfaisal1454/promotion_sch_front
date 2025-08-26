import { Navigate } from "react-router-dom";
import { useUser } from "./UseProvider";

const ProtectedRoute = ({ children }) => {
const { user } = useUser();
  
  if (user.role !== 'Admin') {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;