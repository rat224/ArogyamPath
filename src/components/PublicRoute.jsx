import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "./PageLoader";

const PublicRoute = ({ children }) => {
  const { currentUser, userDoc, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (currentUser) {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");

    if (justLoggedIn) {
      sessionStorage.removeItem("justLoggedIn");
      return <Navigate to="/role-entry" replace />;
    }
  
    const roleVerified = localStorage.getItem("roleVerified");

    // Redirect to dashboard only if role is verified AND completed
    if (roleVerified && userDoc?.completedRoles?.includes(roleVerified)) {
      return <Navigate to={`/dashboard/${roleVerified}`} replace />;
    }
    
    return <Navigate to="/role-entry" replace />;
  }

  return children;
};

export default PublicRoute;
