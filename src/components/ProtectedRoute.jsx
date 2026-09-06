import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "./PageLoader";

const ProtectedRoute = ({ children }) => {
  const { currentUser, userDoc, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  const roleVerified = localStorage.getItem("roleVerified");
  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  if (isDashboardRoute) {
    
    const pathSegments = location.pathname.split("/");
    const requestedRole = pathSegments[2]; 
    
    // Check the official database record 
    const hasPermission = userDoc?.completedRoles?.includes(requestedRole);

    if (!hasPermission) {
      return <Navigate to="/role-entry" replace />;
    }

    if (roleVerified && requestedRole && roleVerified !== requestedRole) {
      return <Navigate to={`/dashboard/${roleVerified}`} replace />;
    }

    if (!roleVerified) {
      return <Navigate to="/role-entry" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
