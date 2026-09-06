
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Stethoscope, Calendar, History, UserCircle, LogOut, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { logOut } from "../../../firebase/services/auth";
import PatientOverview from "./components/PatientOverview";
import SymptomChecker from "./components/SymptomChecker";
import PatientAppointment from "./components/PatientAppointment";
import SymptomHistory from "./components/SymptomHistory";
import PatientProfileUpdate from "./components/PatientProfileUpdate";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/config";
import { updateDoc, doc, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";

const PatientDashboard = () => {
  const { t } = useTranslation();
  const { currentUser, userDoc } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [suggestedSpecialty, setSuggestedSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // REAL-TIME PATIENT PROFILE LISTENER
  useEffect(() => {
    if (!currentUser) return;
    const docRef = doc(db, "patients", currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setProfileData(snap.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching patient profile:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleTabChange = (tab, specialty = "") => {
    setActiveTab(tab);
    setSuggestedSpecialty(specialty);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success(t("auth.sign_out_success"));
      navigate("/");
    } catch (error) {
      console.error("Patient logout failed:", error);
      toast.error(t("auth.errorUnexpected"));
    }
  };

  const handleRoleSwitch = async () => {
    try {
      const targetRole = "doctor";
      const isCompleted = userDoc?.completedRoles?.includes(targetRole);

      if (isCompleted) {
        // AUTH SYNC: Set verification and update cloud role
        localStorage.setItem("roleVerified", targetRole);
        await updateDoc(doc(db, "users", currentUser.uid), { role: targetRole });
        navigate("/dashboard/doctor");
      } else {
        // ONBOARDING: Redirect to setup if first time
        toast(t("dashboard.switch_to_doctor") + "...", { icon: "🔄" });
        navigate(`/profile-setup/${targetRole}`);
      }
    } catch (error) {
      console.error("Switch failed:", error);
      toast.error(t("dashboard.switch_failed"));
    }
  };

  const navItems = [
    { id: "overview", icon: <LayoutDashboard size={20} />, label: t("dashboard.overview"), color: "emerald" },
    { id: "symptom", icon: <Stethoscope size={20} />, label: t("dashboard.symptom_checker"), color: "purple" },
    { id: "appointments", icon: <Calendar size={20} />, label: t("dashboard.appointments"), color: "blue" },
    { id: "history", icon: <History size={20} />, label: t("dashboard.history"), color: "amber" },
    { id: "profile", icon: <UserCircle size={20} />, label: t("dashboard.profile"), color: "indigo" },
    { id: "switch", icon: <RefreshCw size={20} />, label: t("dashboard.switch_to_doctor"), action: handleRoleSwitch, special: true, hoverColor: "blue" },
    { id: "logout", icon: <LogOut size={20} />, label: t("dashboard.sign_out"), action: handleLogout, danger: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4 shadow-sm"></div>
        <p className="text-emerald-900/40 font-black text-xs uppercase tracking-widest animate-pulse">
          {t("dashboard.loading")}
        </p>
      </div>
    );
  }

  const displayData = profileData || userDoc;

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      userDoc={displayData}
      roleTitle={t("dashboard.patient_account")}
      roleColor="emerald"
      welcomeName={(displayData?.fullName || "there").split(" ")[0]}
    >
      {/* TAB CONTENT */}
      {activeTab === "overview" && (
        <PatientOverview
          t={t}
          userDoc={displayData}
          setActiveTab={handleTabChange}
        />
      )}

      {activeTab === "symptom" && (
        <SymptomChecker
          t={t}
          setActiveTab={handleTabChange}
        />
      )}

      {activeTab === "appointments" && (
        <PatientAppointment
          t={t}
          initialSearch={suggestedSpecialty}
        />
      )}

      {activeTab === "profile" && (
        <PatientProfileUpdate
          existingData={displayData}
        />
      )}

      {activeTab === "history" && (
        <SymptomHistory />
      )}
    </DashboardLayout>
  );
};

export default PatientDashboard;
