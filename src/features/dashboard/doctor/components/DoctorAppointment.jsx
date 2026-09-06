import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, Clock, User, ChevronRight, Search, Video, Building2, X, AlertCircle, Phone, MapPin, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { db } from "../../../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";

const DoctorAppointment = ({ t }) => {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("upcoming");
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  //  Final Stable Auto-Cleanup: Move overdue appointments to 'completed'
  useEffect(() => {
    if (!currentUser?.uid) return;

    const cleanupOverdue = async () => {
      try {
        console.log("Checking overdue appointments...");
        const { getDocs, writeBatch, doc } = await import("firebase/firestore");

        const overdueQuery = query(
          collection(db, "appointments"),
          where("doctorId", "==", currentUser.uid),
          where("status", "==", "upcoming")
        );

        const snapshot = await getDocs(overdueQuery);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const overdueDocs = snapshot.docs.filter((d) => {
          const data = d.data();
          const appDateStr = data.rawDate || data.date;
          if (!appDateStr) return false;

          let appointmentDate;
          if (appDateStr.includes('-')) {
            // SAFE DATE PARSING for YYYY-MM-DD
            const [year, month, day] = appDateStr.split('-');
            appointmentDate = new Date(Number(year), Number(month) - 1, Number(day));
          } else {
            // Fallback for other formats 
            appointmentDate = new Date(appDateStr);
          }

          appointmentDate.setHours(0, 0, 0, 0);
          return appointmentDate < todayDate;
        });

        if (overdueDocs.length > 0) {
          const batch = writeBatch(db);
          overdueDocs.forEach((d) => {
            batch.update(doc(db, "appointments", d.id), {
              status: "completed",
              completedAt: new Date()
            });
          });
          await batch.commit();
          console.log(`Successfully auto-cleaned ${overdueDocs.length} appointments.`);
        }
      } catch (error) {
        console.error("Auto-cleanup failed:", error);
      }
    };

    cleanupOverdue();
  }, [currentUser?.uid]);

  //  Fetch Real-time Upcoming Appointments (Limited to 50 for performance)
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", currentUser.uid),
      where("status", "==", "upcoming")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let upcomingData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          patientName: data.patientName || "Anonymous",
          age: data.patientAge || data.age || "N/A",
          gender: data.patientGender || data.gender || "N/A",
          phone: data.patientPhone || data.phone || "N/A",
          address: data.patientAddress || data.address || "N/A",
          symptoms: data.symptoms || "No symptoms provided",
          date: data.date || data.rawDate || "No Date",
          time: data.time || "No Time",
          type: data.mode === "video" ? "Video Consult" : "Clinic Visit",
          status: "upcoming"
        };
      });

      setAppointments(prev => {
        const historyData = prev.filter(a => a.status !== "upcoming");
        return [...upcomingData, ...historyData];
      });
    }, (error) => {
      console.error("Error fetching upcoming:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const fetchHistory = useCallback(async (isLoadMore = false) => {
    if (!currentUser || (isLoadMore && !lastVisible)) return;

    setIsMoreLoading(true);
    try {
      const { getDocs, limit, startAfter, orderBy } = await import("firebase/firestore");

      let q = query(
        collection(db, "appointments"),
        where("doctorId", "==", currentUser.uid),
        where("status", "==", activeSubTab),
        orderBy("rawDate", "desc"), // Latest First
        limit(10)
      );

      if (isLoadMore && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      const newHistory = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          patientName: data.patientName || "Anonymous",
          age: data.patientAge || data.age || "N/A",
          gender: data.patientGender || data.gender || "N/A",
          phone: data.patientPhone || data.phone || "N/A",
          address: data.patientAddress || data.address || "N/A",
          symptoms: data.symptoms || "No symptoms provided",
          date: data.date || data.rawDate || "No Date",
          time: data.time || "No Time",
          type: data.mode === "video" ? "Video Consult" : "Clinic Visit",
          status: data.status
        };
      });

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      setHasMore(snapshot.docs.length === 10);

      setAppointments(prev => {
        const upcomingData = prev.filter(a => a.status === "upcoming");
        const otherHistory = isLoadMore
          ? prev.filter(a => a.status !== "upcoming")
          : prev.filter(a => a.status !== "upcoming" && a.status !== activeSubTab);
        return [...upcomingData, ...otherHistory, ...newHistory];
      });

    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(t("patient_appointments.failed_load_history") || "Failed to load history.");
    } finally {
      setIsMoreLoading(false);
    }
  }, [currentUser, lastVisible, activeSubTab, t]);

  useEffect(() => {
    if (activeSubTab !== "upcoming") {
      setLastVisible(null);
      setHasMore(true);
      fetchHistory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]);

  // Helper for 24h conversion
  const to24h = (timeStr) => {
    if (!timeStr) return "00:00";
    const parts = timeStr.split(' ');
    if (parts.length < 2) return "00:00";
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const filteredAppointments = useMemo(() => {
    let result = appointments.filter(app => {
      // 1. Filter by Status Tab
      if (activeSubTab === "upcoming") {
        if (app.status !== "upcoming") return false;
      } else if (activeSubTab === "completed") {
        if (app.status !== "completed") return false;
      } else if (activeSubTab === "cancelled") {
        if (app.status !== "cancelled") return false;
      }

      // 2. Filter by Consult Type
      if (filterType !== "All" && app.type !== filterType) return false;

      return true;
    }).filter(app =>
      app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    //  Dynamic Sorting: Ascending for Upcoming, Descending for others
    result.sort((a, b) => {
      const dateA = a.rawDate || a.date || "";
      const dateB = b.rawDate || b.date || "";
      const dateDiff = dateA.localeCompare(dateB);

      const multiplier = activeSubTab === "upcoming" ? 1 : -1;

      if (dateDiff !== 0) return dateDiff * multiplier;

      // Time comparison if dates are same
      return to24h(a.time).localeCompare(to24h(b.time)) * multiplier;
    });

    return result;
  }, [appointments, activeSubTab, filterType, searchQuery]);

  //  Group Appointments by Date
  const groupedAppointments = filteredAppointments.reduce((groups, app) => {
    const date = app.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(app);
    return groups;
  }, {});

  const handleAction = async (id, newStatus) => {
    try {
      const { doc, updateDoc, deleteField } = await import("firebase/firestore");
      const appRef = doc(db, "appointments", id);

      const updateData = { status: newStatus };
      if (newStatus === "completed" || newStatus === "cancelled") {
        updateData.meetingRoomId = deleteField();
      }

      await updateDoc(appRef, updateData);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      setIsDetailModalOpen(false); // 🛡️ Close modal on successful update
      toast.success(t("patient_appointments.status_updated") || `Appointment marked as ${newStatus}`, { icon: '✅' });
    } catch (error) {
      console.error("Action update failed:", error);
      toast.error(t("patient_appointments.status_update_failed") || "Failed to update appointment status");
    }
  };

  const startVideoCall = async (app) => {
    try {
      let roomId = app.meetingRoomId;
      let needsUpdate = false;
      
      if (!roomId) {
        const shortHash = Math.random().toString(36).substring(2, 10);
        roomId = `ArogyamPath_${shortHash}_${app.id ? app.id.slice(-4) : 'call'}`;
        needsUpdate = true;
      }
      
      //  Open window IMMEDIATELY to prevent Safari/Chrome from blocking the popup!
      window.open(`https://meet.jit.si/${roomId}`, '_blank');
      
      if (needsUpdate) {
        // Run DB update asynchronously without blocking the window
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "appointments", app.id), { meetingRoomId: roomId });
      }
      
      toast.success(t("patient_appointments.opening_video") || "Opening Video Consultation...");
    } catch (error) {
      console.error("Video Call Error:", error);
      toast.error(t("patient_appointments.video_failed") || "Could not start video call");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex w-full md:w-fit overflow-x-auto gap-1.5 md:gap-2 p-1.5 bg-gray-100/50 rounded-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button onClick={() => setActiveSubTab("upcoming")} className={`whitespace-nowrap flex-1 md:flex-none px-3 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "upcoming" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{t("appointments.upcoming")}</button>
          <button onClick={() => setActiveSubTab("completed")} className={`whitespace-nowrap flex-1 md:flex-none px-3 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "completed" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{t("appointments.completed")}</button>
          <button onClick={() => setActiveSubTab("cancelled")} className={`whitespace-nowrap flex-1 md:flex-none px-3 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === "cancelled" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{t("appointments.cancelled")}</button>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t("appointments.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all text-sm font-bold text-gray-700"
          />
        </div>
      </div>

      {/*  CONSULT TYPE FILTERS */}
      <div className="flex overflow-x-auto gap-2 px-1 pr-6 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { id: "All", label: t("appointments.all_consults"), icon: null },
          { id: "Clinic Visit", label: t("appointments.clinic_visit"), icon: <Building2 size={12} /> },
          { id: "Video Consult", label: t("appointments.video_consult"), icon: <Video size={12} /> }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${filterType === type.id
              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100"
              : "bg-white text-gray-400 border-gray-100 hover:border-blue-200 hover:text-gray-600"
              }`}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      {/*  GROUPED APPOINTMENT LIST */}
      <div className="space-y-10">
        {Object.keys(groupedAppointments).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
            <AlertCircle size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-400 font-bold">{t("appointments.no_appointments_category")}</p>
          </div>
        ) : (
          Object.entries(groupedAppointments).map(([date, apps]) => (
            <div key={date} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">{date}</h3>
                <div className="h-px w-full bg-gradient-to-r from-gray-100 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {apps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => { setSelectedAppointment(app); setIsDetailModalOpen(true); }}
                    className={`group bg-white p-4 md:p-5 rounded-3xl md:rounded-[2rem] border border-gray-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 ${app.status === 'cancelled' ? 'opacity-60' : ''}`}
                  >

                    {/* AVATAR & MAIN DETAILS */}
                    <div className="flex items-start gap-3 md:gap-4 w-full md:flex-1">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 ${app.status === 'upcoming' ? 'bg-blue-50 text-blue-600' : app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        <User className="w-6 h-6 md:w-7 md:h-7" />
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${app.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {t(`appointments.${app.status}`)}
                          </span>
                          <span className="text-[9px] md:text-[10px] font-bold text-gray-400 truncate">{app.bookingId || app.id}</span>
                        </div>
                        <h4 className="text-base md:text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">{app.patientName}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">{app.age} yrs • {app.gender}</p>
                          <p className="text-[9px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Phone size={10} /> {app.phone}
                          </p>
                        </div>
                      </div>

                      {/* MOBILE CHEVRON */}
                      <div className="md:hidden mt-2 shrink-0">
                        <ChevronRight size={18} className="text-gray-300" />
                      </div>
                    </div>

                    {/* MOBILE DIVIDER */}
                    <div className="w-full h-px bg-gray-50 md:hidden"></div>

                    {/* DATE, TIME & ACTIONS */}
                    <div className="flex items-center justify-between w-full md:w-auto md:gap-8 shrink-0">
                      <div className="flex flex-row md:flex-col gap-4 md:gap-1 text-left shrink-0">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-[11px] md:text-xs font-black">{app.date}</span>
                        </div>
                        {app.status === 'active' ? (
                          <div className="flex items-center gap-2 text-emerald-600 animate-pulse">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{t("appointments.in_progress")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock size={14} />
                            <span className="text-[10px] md:text-[11px] font-bold">{app.time}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        {app.status === 'upcoming' && app.type === 'Video Consult' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startVideoCall(app);
                            }}
                            className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-blue-600 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 shrink-0"
                          >
                            <Video size={14} />
                            {app.meetingRoomId ? t("appointments.join_call") : t("appointments.start_call")}
                          </button>
                        )}
                        {/* DESKTOP CHEVRON */}
                        <button className="hidden md:flex p-3 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/*  LOAD MORE BUTTON */}
        {activeSubTab !== "upcoming" && hasMore && (
          <div className="flex justify-center py-10 animate-in fade-in duration-500">
            <button
              onClick={() => fetchHistory(true)}
              disabled={isMoreLoading}
              className={`group flex items-center gap-3 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isMoreLoading
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 border border-blue-100 hover:border-blue-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
                }`}
            >
              {isMoreLoading ? (
                <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <RefreshCw size={14} className="group-hover:rotate-180 transition-all duration-500" />
              )}
              {isMoreLoading ? t("appointments.loading_records") : t("appointments.load_more_history")}
            </button>
          </div>
        )}
      </div>

      {/*  DETAIL MODAL */}
      {isDetailModalOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner"><User size={24} /></div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{t("appointments.details_title")}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedAppointment.bookingId || selectedAppointment.id}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={18} /></button>
              </div>

              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t("appointments.patient_name_label")}</p>
                    <p className="text-sm font-black text-gray-900">{selectedAppointment.patientName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t("appointments.contact_label")}</p>
                    <p className="text-sm font-black text-blue-600">{selectedAppointment.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t("appointments.address_label")}</p>
                    <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <MapPin size={12} className="text-red-500" />
                      {selectedAppointment.address}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t("appointments.schedule_label")}</p>
                    <p className="text-sm font-black text-gray-900">{selectedAppointment.date}, {selectedAppointment.time}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("appointments.symptoms_label")}</p>
                  <div className="p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 italic">
                    "{selectedAppointment.symptoms}"
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                    {selectedAppointment.type === 'Video Consult' ? <Video size={18} /> : <Building2 size={18} />}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">{t("appointments.mode_label")}</p>
                    <p className="text-sm font-black text-blue-800">{selectedAppointment.type === 'Video Consult' ? t("appointments.video_consult") : t("appointments.clinic_visit")}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 pb-6 px-6 border-t border-gray-50 flex gap-4">
                {selectedAppointment.status === 'upcoming' && (
                  <button
                    onClick={() => handleAction(selectedAppointment.id, 'completed')}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    {t("appointments.mark_as_completed")}
                  </button>
                )}
                {(selectedAppointment.status === 'completed' || selectedAppointment.status === 'cancelled') && (
                  <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">{t("appointments.close_record")}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointment;
