import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { logOut } from "../../../firebase/services/auth";
import { LogOut, LayoutDashboard, Users, Clock, FileText, RefreshCw, Settings, UserCircle, Calendar } from "lucide-react";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import DoctorOverview from "./components/DoctorOverview";
import DoctorAppointment from "./components/DoctorAppointment";
import DoctorProfileUpdate from "./components/DoctorProfileUpdate";
import DoctorAvailability from "./components/DoctorAvailability";

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  //  SCROLL TO TOP ON MOUNT
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.scrollTop = 0;
  }, []);

  //  Fetch Role-Specific Details 
  useEffect(() => {
    if (!currentUser) return;
    const docRef = doc(db, "doctors", currentUser.uid);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setProfileData({ ...userDoc, ...snap.data() });
      } else {
        setProfileData(userDoc);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching doctor profile:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, userDoc]);

  //  ROLE SWITCH LOGIC
  const handleRoleSwitch = async () => {
    const targetRole = "patient";
    const completedRoles = userDoc?.completedRoles || [];

    if (completedRoles.includes(targetRole)) {
      const previousRole = userDoc?.role;
      try {
        localStorage.setItem("roleVerified", targetRole);
        document.body.setAttribute("data-role", targetRole);

        await updateDoc(doc(db, "users", currentUser.uid), { role: targetRole });
        navigate(`/dashboard/${targetRole}`);
      } catch (error) {
        console.error("Role switch failed:", error);
        if (previousRole) {
          localStorage.setItem("roleVerified", previousRole);
          document.body.setAttribute("data-role", previousRole);
        }
        toast.error(t("doctor_dashboard.sync_failed"));
      }
    } else {
      toast(t("dashboard.switch_to_patient") + "...", { icon: "🔄" });
      navigate(`/profile-setup/${targetRole}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      sessionStorage.clear();
      localStorage.clear();
      document.body.removeAttribute("data-role");
      toast.success(t("doctor_dashboard.logout_success"));
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Doctor logout failed:", error);
      toast.error(t("doctor_dashboard.logout_failed"));
    }
  };

  //  Auto Scroll to Top on Tab Change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const navItems = [
    { id: "overview", icon: <LayoutDashboard size={20} />, label: t("dashboard.overview") },
    { id: "appointments", icon: <Clock size={20} />, label: t("dashboard.appointments") },
    { id: "availability", icon: <Calendar size={20} />, label: t("dashboard.availability") },
    { id: "profile", icon: <UserCircle size={20} />, label: t("dashboard.profile") },
    { id: "switch", icon: <RefreshCw size={20} />, label: t("dashboard.switch_to_patient"), action: handleRoleSwitch, special: true, hoverColor: "emerald" },
    { id: "logout", icon: <LogOut size={20} />, label: t("dashboard.sign_out"), action: handleLogout, danger: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4 shadow-sm"></div>
        <p className="text-blue-900/40 font-black text-xs uppercase tracking-widest animate-pulse">
          {t("dashboard.loading")}
        </p>
      </div>
    );
  }

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userDoc={profileData || userDoc}
      roleTitle={t("dashboard.doctor_account")}
      roleColor="blue"
      welcomeName={`Dr. ${(profileData?.fullName || userDoc?.fullName || "Consultant").split(" ")[0]}`}
    >
      {/*  TAB CONTENT */}
      {activeTab === "overview" && (
        <DoctorOverview
          t={t}
          userDoc={profileData || userDoc}
          onViewSchedule={() => setActiveTab("appointments")}
        />
      )}

      {activeTab === "appointments" && (
        <DoctorAppointment
          t={t}
        />
      )}

      {activeTab === "availability" && <DoctorAvailability t={t} />}

      {activeTab === "profile" &&
        <DoctorProfileUpdate existingData={profileData || userDoc} />}

    </DashboardLayout>
  );
};

export default DoctorDashboard;
