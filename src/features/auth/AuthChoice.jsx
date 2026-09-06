import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const AuthChoice = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-in fade-in duration-1000">
        
        {/* TYPOGRAPHY (TRANSLATED) */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {t("welcome")}
          </h1>
          <p className="text-sm text-gray-500">
            {t("auth.chooseOption")}
          </p>
        </div>

        {/* BUTTON SYSTEM (TRANSLATED) */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/login")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold transition hover:shadow-md h-12"
          >
            {t("auth.login")}
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold transition hover:bg-gray-50 h-12"
          >
            {t("auth.signup")}
          </button>
        </div>

        {/* BACK OPTION (Typography) */}
        <div className="text-center">
          <button 
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-gray-400 hover:text-green-600 transition"
          >
            ← {t("auth.back")}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthChoice;
