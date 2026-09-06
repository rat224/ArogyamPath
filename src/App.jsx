import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LanguageSelection from "./features/auth/LanguageSelection";
import AuthChoice from "./features/auth/AuthChoice";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import RoleEntry from "./features/auth/RoleEntry";
import ProfileSetup from "./features/auth/ProfileSetup";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import PageLoader from "./components/PageLoader";
import { LocationProvider } from "./context/LocationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css"; 

// Lazy load heavy dashboard components
const PatientDashboard = lazy(() => import("./features/dashboard/patient/PatientDashboard"));
const DoctorDashboard = lazy(() => import("./features/dashboard/doctor/DoctorDashboard"));


const App = () => {
  return (
    <div 
      style={{ background: "var(--bg-gradient)" }} 
      className="min-h-screen selection:bg-emerald-100 selection:text-emerald-900"
    >
      <LocationProvider>
        <ErrorBoundary>
          <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<PublicRoute><LanguageSelection /></PublicRoute>} />
                
                <Route path="/auth-choice" element={<PublicRoute><AuthChoice /></PublicRoute>} />
                
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                
                <Route path="/role-entry" element={<ProtectedRoute><RoleEntry /></ProtectedRoute>} />
                
                <Route path="/profile-setup/:role" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

                <Route path="/dashboard/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </LocationProvider>
    </div>
  );
};

export default App;
