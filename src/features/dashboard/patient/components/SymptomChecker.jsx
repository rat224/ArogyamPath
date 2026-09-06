import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, MessageSquare, Sparkles, ChevronRight, Mic, MicOff, Stethoscope, ShieldAlert, Info, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { analyzeSymptoms } from "../../../../services/aiService";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../../context/AuthContext";
import { useLocation } from "../../../../context/LocationContext";

const SymptomChecker = ({ t: propT, setActiveTab }) => {
  const { selectedCity: externalCity } = useLocation();
  const { t: localT, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const t = propT || localT;
  const getTranslatedSpecialist = (specialist) => {
    if (!specialist) return "";
    const specKey = specialist.toLowerCase().replace(/\s+/g, '_');
    return t(`profile_setup.spec_${specKey}`) || specialist;
  };
  const [symptomText, setSymptomText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
        if (transcript.length <= 500) setSymptomText(transcript);
      };
      recognitionRef.current.onerror = () => { setIsListening(false); toast.error(t("symptom_checker.speech_failed")); };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [t]);

  const toggleListening = () => {
    if (!recognitionRef.current) return toast.error(t("symptom_checker.not_supported"));
    if (isListening) { recognitionRef.current.stop(); }
    else { setSymptomText(""); recognitionRef.current.start(); setIsListening(true); }
  };

  const handleAnalyzeSymptoms = async () => {
    if (!symptomText.trim()) return toast.error(t("symptom_checker.describe_symptoms_error"));
    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      setIsAnalyzing(true);
      const result = await analyzeSymptoms(symptomText, currentUser?.uid, i18n.language);
      setAssessment(result);
    } catch (error) { toast.error(error.message); }
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto px-4 md:px-0">

      {/* PREMIUM GREEN HERO */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-9 text-white relative overflow-hidden shadow-lg border border-emerald-500/20">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider border border-white/10">
              <Sparkles size={12} className="text-yellow-300" /> {t("symptom_checker.smart_guidance_active")}
            </div>
          </div>

          <div className="space-y-1 text-left">
            <h3 className="text-3xl font-bold tracking-tight">{t("symptom_checker.how_feeling")}</h3>
            <p className="text-emerald-50/70 text-xs italic">{t("symptom_checker.describe_for_guidance")}</p>
          </div>

          <div className="bg-black/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-4 relative">
            <div className="space-y-1">
              <div className="relative">
                <textarea
                  value={symptomText}
                  onChange={(e) => e.target.value.length <= 500 && setSymptomText(e.target.value)}
                  placeholder={isListening ? t("symptom_checker.listening") : t("symptom_checker.placeholder")}
                  className="w-full bg-transparent border-none text-white placeholder:text-white/30 text-lg font-semibold focus:ring-0 focus:outline-none min-h-[80px] resize-none pr-10"
                />
                {symptomText && (
                  <button 
                    onClick={() => {
                      setSymptomText("");
                      if (isListening && recognitionRef.current) {
                        recognitionRef.current.stop();
                        setIsListening(false);
                      }
                    }}
                    className="absolute top-0 right-0 p-2 text-white/40 hover:text-white transition-colors"
                    title={t("symptom_checker.clear_text")}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <div className="flex justify-end">
                <span className="text-[9px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md">{symptomText.length}/500</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button onClick={toggleListening} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'}`}>
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>

              <button
                onClick={handleAnalyzeSymptoms}
                disabled={isAnalyzing}
                className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-700 rounded-full animate-spin" /> : <BrainCircuit size={18} />}
                {isAnalyzing ? t("symptom_checker.analyzing") : t("symptom_checker.analyze_now")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {assessment && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
          {assessment.emergency && (
            <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center gap-4 shadow-lg border-2 border-red-400/20">
              <ShieldAlert size={24} className="shrink-0" />
              <div className="text-xs font-bold uppercase tracking-tight">{t("symptom_checker.emergency_alert")}</div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="p-4 bg-emerald-50/30 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200/50"><Stethoscope size={20} /></div>
                <div className="text-left">
                  <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-200 text-emerald-700">{t("symptom_checker.assessment_result")}</span>
                  <h4 className="text-base font-bold text-gray-900 leading-tight">{t("symptom_checker.guidance_summary")}</h4>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* SPECIALIST INFO CARD */}
                <div className="p-5 bg-gradient-to-br from-emerald-50/30 to-teal-50/10 rounded-3xl border border-emerald-100/30 flex flex-col justify-between space-y-4 text-left">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-200 text-emerald-700">
                        {t("symptom_checker.recommended")}
                      </span>
                      <h3 className="text-2xl font-black text-emerald-800 leading-tight">{getTranslatedSpecialist(assessment.primarySpecialist)}</h3>
                    </div>

                    {assessment.reasoning && (
                      <div className="p-3 bg-white/60 border border-emerald-100/20 rounded-xl relative overflow-hidden">
                        <span className="text-[8px] font-black text-emerald-700/60 uppercase tracking-wider block mb-1">
                           {i18n.language?.startsWith('hi') ? "एआई विश्लेषण" : "AI ANALYSIS"}
                        </span>
                        <p className="text-xs font-semibold text-emerald-800/80 leading-relaxed italic">
                          "{assessment.reasoning}"
                        </p>
                      </div>
                    )}
                  </div>

                  {assessment.secondarySpecialists.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-emerald-100/30">
                      <h5 className="font-bold text-gray-400 uppercase tracking-widest text-[8px]">{t("symptom_checker.also_recommended")}</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {assessment.secondarySpecialists.map((s, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white text-emerald-800/70 rounded-lg text-[9px] font-bold border border-emerald-100/20 shadow-sm">{getTranslatedSpecialist(s)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SUGGESTED ACTIONS CARD */}
                <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100/80 flex flex-col justify-between space-y-4 text-left">
                  <div className="space-y-3">
                    <h5 className="font-bold text-gray-400 uppercase tracking-widest text-[8px]">{t("symptom_checker.suggested_actions")}</h5>
                    <div className="space-y-2">
                      {assessment.precautions?.map((p, i) => (
                        <div key={i} className="px-3.5 py-2 bg-white text-gray-700 rounded-xl text-xs font-semibold border border-gray-100 shadow-sm flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FINAL SUGGESTION CARD */}
                  <div className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-100/10 relative overflow-hidden text-center mt-auto">
                    <p className="text-emerald-800/70 text-[11px] font-bold italic leading-tight">
                      "{assessment.suggestion}"
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-6 items-stretch max-w-xl mx-auto">
                <button
                  onClick={() => {
                    if (!externalCity) {
                      toast.error(t("symptom_checker.select_location_first"), { icon: "📍" });
                      return;
                    }
                    setActiveTab("appointments", assessment.primarySpecialist);
                  }}
                  className={`flex flex-col items-center p-4 text-white rounded-3xl transition-all shadow-lg active:scale-[0.98] text-center h-full group ${assessment.emergency ? 'bg-red-600 hover:bg-red-700 shadow-red-900/10' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10'}`}
                >
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 mb-1.5">{t("symptom_checker.recommended_path")}</span>
                  <h5 className="text-sm font-black leading-tight mb-3">{t("symptom_checker.consult")} {getTranslatedSpecialist(assessment.primarySpecialist)}</h5>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                    {t("symptom_checker.book_now")} <ChevronRight size={10} />
                  </div>
                </button>

                <button
                  onClick={() => {
                    if (!externalCity) {
                      toast.error(t("symptom_checker.select_location_first"), { icon: "📍" });
                      return;
                    }
                    setActiveTab("appointments", "");
                  }}
                  className="flex flex-col items-center p-4 bg-gray-50 border border-gray-100 text-gray-900 rounded-3xl hover:bg-gray-100 transition-all active:scale-[0.98] text-center h-full group"
                >
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{t("symptom_checker.manual_path")}</span>
                  <h5 className="text-sm font-black leading-tight mb-3">{t("symptom_checker.search_all_doctors")}</h5>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                    {t("symptom_checker.book_now")} <ChevronRight size={10} />
                  </div>
                </button>
              </div>

              <div className="flex items-start gap-2 pt-2 opacity-40 text-left">
                <Info size={12} className="mt-0.5 shrink-0" />
                <p className="text-[8px] font-bold leading-tight uppercase tracking-tighter italic">{assessment.disclaimer}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;
