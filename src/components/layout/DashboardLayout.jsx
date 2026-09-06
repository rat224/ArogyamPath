
import React, { useState, useRef, useEffect } from "react";
import { Menu, X, Bell, Languages, ChevronDown, Check, MapPin, Search, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import { useLocation } from "../../context/LocationContext";

const DashboardLayout = ({
  children,
  navItems,
  activeTab,
  setActiveTab,
  userDoc,
  roleTitle,
  roleColor = "emerald",
  welcomeName
}) => {
  const {
    selectedCity,
    setSelectedCity,
    predictions,
    handleDetectLocation,
    searchCities,
    isLocating
  } = useLocation();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const dropdownRef = useRef(null);
  const locRef = useRef(null);
  const [locSearch, setLocSearch] = useState("");
  const [isLocOpen, setIsLocOpen] = useState(false);



  const languages = [
    { code: "en", label: "English", flag: "EN" },
    { code: "hi", label: "हिन्दी", flag: "HI" }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
      if (locRef.current && !locRef.current.contains(event.target)) {
        setIsLocOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsLangOpen(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden font-sans">
      {/*  AMBIENT BACKGROUND ORBS */}
      <div className={`fixed top-[-10%] left-[-10%] w-[40%] h-[40%] ${roleColor === 'emerald' ? 'bg-emerald-400/10' : 'bg-blue-400/10'} rounded-full blur-[120px] pointer-events-none animate-pulse`}></div>
      <div className={`fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${roleColor === 'emerald' ? 'bg-emerald-400/10' : 'bg-blue-400/10'} rounded-full blur-[120px] pointer-events-none animate-pulse`}></div>

      {/* SIDEBAR */}
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isSidebarOpen}
        setIsMobileOpen={setSidebarOpen}
        roleColor={roleColor}
      />

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto z-10 custom-scrollbar relative">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 mb-8 md:mb-12">
          <div className="flex items-start justify-between animate-in slide-in-from-left duration-700 shrink-0 w-full md:w-auto gap-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight flex-1 min-w-0 break-words">
              {t("dashboard.hello")} <span className={`text-${roleColor}-600`}>{welcomeName}</span>
            </h2>

            {/* MOBILE TOGGLE */}
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className={`lg:hidden shrink-0 p-2.5 mt-1 bg-white shadow-sm border border-gray-100 rounded-[14px] text-${roleColor}-600 active:scale-90 transition-transform`}
            >
              {isSidebarOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
            </button>
          </div>

          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2 md:gap-4 animate-in slide-in-from-right duration-700 shrink-0">

            {/* LOCATION DROPDOWN */}
            <div className="relative shrink-0" ref={locRef}>
              <button
                onClick={() => setIsLocOpen(!isLocOpen)}
                className={`flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2.5 bg-white border ${isLocOpen ? `border-blue-200 ring-4 ring-blue-50` : 'border-gray-100'} rounded-[14px] md:rounded-2xl text-gray-600 transition-all shadow-sm group active:scale-95 ${!selectedCity ? 'ring-2 ring-red-100 border-red-200 animate-pulse' : ''}`}
              >
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-all ${!selectedCity ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  <MapPin size={16} className={`md:w-[18px] md:h-[18px] ${!selectedCity ? 'animate-bounce' : ''}`} />
                </div>
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-0.5 md:px-1 ${!selectedCity ? 'text-red-600' : ''}`}>
                  {selectedCity || "Location"}
                </span>
                <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform duration-300 ${isLocOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLocOpen && (
                <div className="absolute top-full left-0 md:left-auto md:right-0 mt-3 w-[260px] md:w-64 bg-white border border-gray-100 rounded-3xl shadow-2xl shadow-gray-200/50 p-3 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-left md:origin-top-right">

                  {/* SEARCH INPUT */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search city..."
                      value={locSearch}
                      onChange={(e) => {
                        setLocSearch(e.target.value);
                        searchCities(e.target.value);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-1">
                    {locSearch.trim() === "" ? (
                      <div className="p-2 space-y-2">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-2">Current Selection</p>
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${!selectedCity ? 'bg-red-50 text-red-600 border-red-100 italic' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          <MapPin size={14} />
                          <span>{selectedCity || "No location selected"}</span>
                          {selectedCity && <div className="ml-auto bg-blue-600 w-1.5 h-1.5 rounded-full animate-pulse"></div>}
                        </div>

                        {/* Detect Location */}
                        <button
                          disabled={isLocating}
                          onClick={() => {
                            handleDetectLocation();
                            setIsLocOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-3 ${isLocating ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} rounded-xl text-xs font-bold transition-all group`}
                        >
                          <RefreshCw size={14} className={`${isLocating ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                          <span>{isLocating ? 'Locating...' : 'Detect My Location'}</span>
                        </button>
                      </div>
                    ) : (
                      predictions.length > 0 ? (
                        predictions.map((p) => (
                          <button
                            key={p.place_id}
                            onClick={() => {
                              const cityName = p.structured_formatting.main_text;
                              setSelectedCity(cityName);
                              setLocSearch("");
                              setIsLocOpen(false);
                            }}
                            className="w-full flex flex-col items-start px-4 py-3 rounded-xl text-xs font-bold hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all border-b border-gray-50 last:border-none"
                          >
                            <span>{p.structured_formatting.main_text}</span>
                            <span className="text-[9px] font-medium text-gray-400">{p.structured_formatting.secondary_text}</span>
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No cities found</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 🌐 LANGUAGE DROPDOWN */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2.5 bg-white border ${isLangOpen ? `border-${roleColor}-200 ring-4 ring-${roleColor}-50` : 'border-gray-100'} rounded-[14px] md:rounded-2xl text-gray-600 transition-all shadow-sm group active:scale-95`}
              >
                <div className={`w-7 h-7 md:w-8 h-8 rounded-xl bg-${roleColor}-50 flex items-center justify-center text-${roleColor}-600`}>
                  <Languages size={16} className="md:w-[18px] md:h-[18px]" />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-0.5 md:px-1">
                  {currentLang.flag}
                </span>
                <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute top-full right-0 mt-3 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/50 p-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${i18n.language === lang.code
                        ? `bg-${roleColor}-50 text-${roleColor}-600`
                        : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <span>{lang.label}</span>
                      {i18n.language === lang.code && <Check size={16} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className={`p-2.5 md:p-4 shrink-0 bg-white border border-gray-100 rounded-[14px] md:rounded-2xl text-gray-400 hover:text-${roleColor}-600 transition-all shadow-sm relative group`}>
              <Bell size={20} className="md:w-[22px] md:h-[22px]" />
              <span className="absolute top-2.5 right-2.5 md:top-4 md:right-4 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* PROFILE QUICK VIEW */}
            <div className="flex shrink-0 items-center gap-2 md:gap-4 pl-1.5 md:pl-2 bg-white border border-gray-100 rounded-3xl p-1.5 pr-2 md:pr-6 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className={`w-9 h-9 md:w-11 md:h-11 rounded-2xl overflow-hidden bg-${roleColor}-50 border border-${roleColor}-100 flex items-center justify-center`}>
                {userDoc?.photoUrl ? (
                  <img src={userDoc.photoUrl} alt="User Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                ) : (
                  <div className={`text-${roleColor}-600 font-black text-sm md:text-lg`}>
                    {userDoc?.fullName?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="hidden sm:block min-w-0 max-w-[120px] md:max-w-[160px]">
                <p className="text-sm font-black text-gray-900 leading-normal truncate" title={userDoc?.fullName || "Arogya User"}>
                  {userDoc?.fullName || "Arogya User"}
                </p>
                <p className={`text-[10px] font-black text-${roleColor}-600 uppercase tracking-widest leading-normal truncate`} title={roleTitle}>
                  {roleTitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC TAB CONTENT */}
        <div className="min-h-[60vh]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
