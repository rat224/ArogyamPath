import React from "react";
import { BrainCircuit, Sparkles, Activity, Lightbulb, ClipboardCheck, PlusCircle } from "lucide-react";

const PatientOverview = ({ t, setActiveTab }) => {
  const healthTips = t("health_tips", { returnObjects: true });

  const dailyTip = healthTips[Math.floor(Math.random() * healthTips.length)];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">

      {/* SMART CHECKER HERO SECTION */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-900 rounded-[2rem] p-6 sm:p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-emerald-500/10">
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold">
              <ClipboardCheck size={14} className="text-emerald-300" />
              <span>{t('symptom_checker.ready')}</span>
            </div>
            <h3 className="text-3xl md:text-[2.35rem] font-black leading-tight tracking-tight">
              {t('symptom_checker.feeling_unwell')} <br /> {t('symptom_checker.analyze_your_symptoms')}
            </h3>
            <p className="text-emerald-100/80 text-lg font-medium leading-relaxed max-w-lg">
              {t('symptom_checker.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button 
                onClick={() => setActiveTab("symptom")}
                className="w-full sm:w-auto group bg-white text-emerald-900 px-7 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/30 hover:shadow-2xl hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
              >
                <BrainCircuit size={22} className="group-hover:rotate-12 transition-transform" />
                {t("dashboard.symptom_checker")}
              </button>
              
              <button 
                onClick={() => setActiveTab("appointments")}
                className="w-full sm:w-auto group bg-emerald-500/20 backdrop-blur-md text-white border border-white/30 px-7 py-4 rounded-2xl font-black text-lg hover:bg-emerald-500/40 hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
              >
                <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-500" />
                {t("dashboard.book_appointment")}
              </button>
            </div>
          </div>

          <div className="hidden xl:flex w-72 h-72 bg-white/10 rounded-[4rem] backdrop-blur-xl border border-white/20 items-center justify-center relative">
            <Activity size={120} className="text-white/40 animate-pulse" />
          </div>
        </div>
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/5 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px]"></div>
      </div>

      {/* QUICK ACTIONS & TIPS GRID */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* DAILY HEALTH TIP */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-7 rounded-[3rem] border border-amber-100 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
          <div className="space-y-5 relative z-10">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-[1.3rem] flex items-center justify-center">
              <Lightbulb size={28} />
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-amber-200/50 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                {t("dashboard.daily_insight")}
              </div>
              <h4 className="text-[1.375rem] font-black text-gray-900 mb-3 leading-tight">
                {dailyTip}
              </h4>
            </div>
          </div>
          <p className="text-amber-800/60 font-bold text-sm relative z-10">
            {t("dashboard.daily_insight_desc")}
          </p>
          <Sparkles className="absolute bottom-6 right-6 text-amber-200 w-24 h-24 -rotate-12" />
        </div>

      </div>
    </div>
  );
};

export default PatientOverview;
