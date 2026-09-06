import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const LanguageSelection = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);

  useEffect(() => {
    // ROLE-BASED SWITCH: Initializing with "patient" theme logic (Green)
    document.body.setAttribute("data-role", "patient");

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleCustomInstallable = () => {
      setDeferredPrompt(window.deferredPrompt);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa-installable", handleCustomInstallable);

    // If the event fired before mounting, capture it
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-installable", handleCustomInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      window.deferredPrompt = null;
    }
  };

  const handleLanguageSelect = (lng) => {
    i18n.changeLanguage(lng);
    navigate("/auth-choice");
  };

  return (
    // SPACING SYSTEM
    <div className="relative flex items-center justify-center min-h-[90vh] p-6 w-full">
      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="absolute top-4 right-4 md:top-6 md:right-6 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-100 hover:border-emerald-500 hover:shadow-md px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg text-[9px] md:text-xs font-extrabold tracking-wider transition-all duration-300 flex items-center gap-1 md:gap-1.5 shadow-sm animate-in fade-in slide-in-from-top-4 z-50"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-3 w-3 md:h-3.5 md:w-3.5 animate-bounce"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>INSTALL APP</span>
        </button>
      )}

      <div className="max-w-md w-full text-center space-y-10 animate-in fade-in duration-1000">

        {/* LOGO SECTION */}
        <div className="flex flex-col items-center space-y-4">
          <img
            src={logo}
            alt="ArogyamPath Logo"
            className="h-36 w-auto object-contain drop-shadow-sm"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Select Your Language
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 px-4">

          {/* ENGLISH SELECTION CARD */}
          <button
            onClick={() => handleLanguageSelect("en")}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-600 p-6 flex items-center justify-between hover:shadow-md transition group text-left"
          >
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition">
              English
            </h2>
            <div className="bg-gray-50 p-2 rounded-full group-hover:bg-green-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-green-600 transition" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>

          {/* HINDI SELECTION CARD */}
          <button
            onClick={() => handleLanguageSelect("hi")}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-600 p-6 flex items-center justify-between hover:shadow-md transition group text-left"
          >
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition">
              हिंदी
            </h2>
            <div className="bg-gray-50 p-2 rounded-full group-hover:bg-green-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-green-600 transition" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default LanguageSelection;
