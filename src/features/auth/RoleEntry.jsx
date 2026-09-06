import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User, Stethoscope, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { logOut } from "../../firebase/services/auth";
import { useAuth } from "../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

const RoleEntry = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userDoc } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  // If role is already verified for this session, stay on dashboard
  useEffect(() => {
    const roleVerified = localStorage.getItem("roleVerified");
    if (roleVerified && userDoc?.completedRoles?.includes(roleVerified)) {
      navigate(`/dashboard/${roleVerified}`, { replace: true });
    }
  }, [userDoc, navigate]);

  // User must always select a role in this session
  const roles = [
    {
      id: "patient",
      title: t("role_entry.patient_title"),
      desc: t("role_entry.patient_desc"),
      icon: <User size={40} />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      hoverBorder: "hover:border-emerald-500",
      selectedBorder: "border-emerald-500 ring-2 ring-emerald-500/10",
    },
    {
      id: "doctor",
      title: t("role_entry.doctor_title"),
      desc: t("role_entry.doctor_desc"),
      icon: <Stethoscope size={40} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      hoverBorder: "hover:border-blue-500",
      selectedBorder: "border-blue-500 ring-2 ring-blue-500/10",
    },
  ];

  const handleRoleHover = (roleId) => {
    // DYNAMIC THEME SWITCH (Live Preview)
    document.body.setAttribute("data-role", roleId);
  };

  const handleRoleLeave = () => {
    if (!selectedRole) {
      document.body.removeAttribute("data-role");
    } else {
      document.body.setAttribute("data-role", selectedRole);
    }
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    document.body.setAttribute("data-role", roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error(t("role_entry.select_role_error"));
      return;
    }
    
    // MULTI-ROLE SYNC: Update the "Active Role" in the database
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        role: selectedRole
      });
    } catch (error) {
      console.error("Failed to sync active role:", error);
    }

    // If user already finished onboarding for THIS role, go to dashboard.
    if (userDoc?.completedRoles?.includes(selectedRole)) {
      //  VERIFY SESSION: Set the SPECIFIC role key for this session
      localStorage.setItem("roleVerified", selectedRole);
      navigate(`/dashboard/${selectedRole}`, { replace: true });
    } else {
      navigate(`/profile-setup/${selectedRole}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      
      <div className="text-center space-y-2 max-w-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          {t("role_entry.title")}
        </h1>
        <p className="text-gray-500 font-medium">
          {t("role_entry.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {roles.map((role) => (
          <div
            key={role.id}
            onMouseEnter={() => handleRoleHover(role.id)}
            onMouseLeave={handleRoleLeave}
            onClick={() => handleRoleSelect(role.id)}
            className={`
              relative cursor-pointer group transition-all duration-300 transform hover:-translate-y-1
              bg-white p-8 rounded-3xl border-2 shadow-sm
              ${selectedRole === role.id ? role.selectedBorder : `${role.border} ${role.hoverBorder}`}
            `}
          >
            <div className="space-y-6">
              <div className={`w-20 h-20 rounded-2xl ${role.bg} ${role.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                {role.icon}
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {role.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {role.desc}
                </p>
              </div>

              <div className={`
                flex items-center gap-2 font-bold transition-opacity duration-300
                ${selectedRole === role.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                ${role.color}
              `}>
                <span className="text-sm uppercase tracking-wider">{t("role_entry.select_this_role")}</span>
                <ArrowRight size={16} />
              </div>
            </div>

            {selectedRole === role.id && (
              <div className={`absolute top-4 right-4 w-4 h-4 rounded-full ${role.id === 'patient' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
            )}
          </div>
        ))}
      </div>

      {/* CONTINUE BUTTON */}
      <div className="w-full max-w-4xl pt-4">
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-sm
            ${selectedRole === 'patient' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
              selectedRole === 'doctor' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 
              'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          {selectedRole 
            ? t("role_entry.continue", { role: t(`role_entry.${selectedRole}_title`) }) 
            : t("auth.continue")
          }
        </button>
      </div>

      {/* LOGOUT OPTION */}
      <button 
        onClick={async () => {
          await logOut();
          document.body.removeAttribute("data-role");
          navigate("/", { replace: true });
        }}
        className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition"
      >
        ← {t("role_entry.logout")}
      </button>

    </div>
  );
};

export default RoleEntry;
