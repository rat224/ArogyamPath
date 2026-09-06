import React from "react";

const PageLoader = () => {
  const isDoctorPath = window.location.pathname.includes('/doctor');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className={`w-16 h-16 border-4 rounded-full animate-spin mb-4 shadow-sm ${
        isDoctorPath 
          ? 'border-blue-100 border-t-blue-600' 
          : 'border-emerald-100 border-t-emerald-600'
      }`}></div>
      <p className={`font-black text-xs uppercase tracking-widest animate-pulse ${
        isDoctorPath ? 'text-blue-900/40' : 'text-emerald-900/40'
      }`}>
        Healing the data...
      </p>
    </div>
  );
};

export default PageLoader;
