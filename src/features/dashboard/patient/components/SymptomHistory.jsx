import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase/config";
import { collection, query, where } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";
import {
  History,
  Search,
  Calendar,
  Activity,
  BrainCircuit,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";

const SymptomHistory = () => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 📑 Pagination States
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  const fetchHistory = async (isLoadMore = false) => {
    if (!currentUser || (isLoadMore && !lastVisible)) return;

    if (!isLoadMore) setLoading(true);
    else setIsMoreLoading(true);

    try {
      const { getDocs, limit, startAfter, orderBy } = await import("firebase/firestore");
      
      let q = query(
        collection(db, "symptomChecks"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(9)
      );

      if (isLoadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const newRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate()?.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        }) || t("symptom_history.recent")
      }));

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === 9);

      setHistory(prev => isLoadMore ? [...prev, ...newRecords] : newRecords);
    } catch (error) {
      console.error("Error fetching symptom history:", error);
    } finally {
      setLoading(false);
      setIsMoreLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const filteredHistory = React.useMemo(() => history.filter(item =>
    item.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.result.primarySpecialist.toLowerCase().includes(searchQuery.toLowerCase())
  ), [history, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-amber-900/40 font-black text-xs uppercase tracking-widest">{t("symptom_history.fetching")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t("symptom_history.title")}</h2>
          </div>
          <p className="text-gray-400 font-bold text-sm ml-13">{t("symptom_history.subtitle")}</p>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t("symptom_history.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-amber-50 focus:border-amber-200 outline-none transition-all font-bold text-xs"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-gray-100 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900">{t("symptom_history.no_records")}</h3>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">{t("symptom_history.no_records_desc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((record) => (
            <div
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="bg-white rounded-[2.5rem] p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all">
                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                  <ArrowUpRight size={16} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t("symptom_history.check_date")}</p>
                    <p className="text-sm font-black text-gray-900">{record.date}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("symptom_history.reported_symptoms")}</p>
                  <p className="text-xs font-bold text-gray-600 line-clamp-2 leading-relaxed">
                    "{record.symptoms}"
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t("symptom_history.ai_assessment")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900">{record.result.primarySpecialist}</p>
                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${record.result.emergency ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {record.result.emergency ? t("symptom_history.urgent") : t("symptom_history.routine")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/*  LOAD MORE BUTTON */}
      {hasMore && history.length > 0 && (
        <div className="flex justify-center py-10 animate-in fade-in duration-500">
          <button
            onClick={() => fetchHistory(true)}
            disabled={isMoreLoading}
            className={`group flex items-center gap-3 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
              isMoreLoading 
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-amber-600 border border-amber-100 hover:border-amber-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            {isMoreLoading ? (
              <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin"></div>
            ) : (
              <RefreshCw size={14} className="group-hover:rotate-180 transition-all duration-500" />
            )}
            {isMoreLoading ? t("symptom_history.loading_records") : t("symptom_history.load_more")}
          </button>
        </div>
      )}

      {/* REPORT MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <History size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t("symptom_history.report_details")}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedRecord.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t("symptom_history.user_description")}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-700 leading-relaxed italic italic">"{selectedRecord.symptoms}"</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
                      <BrainCircuit size={18} />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t("symptom_history.ai_analysis_result")}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("symptom_history.primary_specialist")}</p>
                      <p className="text-sm font-black text-gray-900">{selectedRecord.result.primarySpecialist}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t("symptom_history.severity_level")}</p>
                      <p className={`text-sm font-black ${selectedRecord.result.emergency ? 'text-red-600' : 'text-green-600'}`}>
                        {selectedRecord.result.emergency ? t("symptom_history.immediate_action") : t("symptom_history.standard_guidance")}
                      </p>
                    </div>
                  </div>

                  {selectedRecord.result.possibleIssues?.length > 0 && (
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 space-y-3">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{t("symptom_history.possible_considerations")}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.result.possibleIssues.map((issue, idx) => (
                          <span key={idx} className="bg-white px-3 py-1.5 rounded-xl text-xs font-black text-amber-800 border border-amber-200">
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("symptom_history.key_precautions")}</p>
                    <div className="space-y-2">
                      {selectedRecord.result.precautions.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl group">
                          <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                            <Activity size={12} />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600">
                  <AlertTriangle size={20} className="shrink-0" />
                  <p className="text-[10px] font-bold leading-relaxed tracking-tight">
                    {t("symptom_history.ai_disclaimer")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomHistory;
