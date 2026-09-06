import React, { useState, useEffect, useMemo } from "react";
import { Users, Clock, Check, ClipboardList, Star, Heart, Calendar } from "lucide-react";
import { db } from "../../../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";

const DoctorOverview = ({ t, onViewSchedule, userDoc }) => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    //  Fetch ALL appointments for this doctor to calculate stats
    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setAppointments(data);
    });

    return () => unsubscribe();
  }, [currentUser]);

  //  Auto-sync ratings to doctor's profile document if out of sync
  useEffect(() => {
    if (!currentUser || appointments.length === 0 || !userDoc) return;

    const syncRatingToProfile = async () => {
      const ratings = appointments.filter(a => a.rating > 0).map(a => a.rating);
      const totalPoints = ratings.reduce((sum, r) => sum + Number(r), 0);
      const count = ratings.length;
      const avgRating = count > 0 ? (totalPoints / count).toFixed(1) : "0.0";

      const dbRating = String(userDoc.rating || "0.0");
      const dbPoints = Number(userDoc.totalRatingPoints || 0);
      const dbCount = Number(userDoc.reviewCount || 0);

      if (
        dbRating !== avgRating ||
        dbPoints !== totalPoints ||
        dbCount !== count
      ) {
        try {
          const { doc, updateDoc } = await import("firebase/firestore");
          const docRef = doc(db, "doctors", currentUser.uid);
          await updateDoc(docRef, {
            rating: avgRating,
            totalRatingPoints: totalPoints,
            reviewCount: count
          });
          console.log("Successfully synced rating to doctor profile:", { avgRating, totalPoints, count });
        } catch (error) {
          console.error("Failed to sync rating to profile:", error);
        }
      }
    };

    syncRatingToProfile();
  }, [appointments, userDoc, currentUser]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const totalBookings = appointments.length;
    const todayCount = appointments.filter(a => (a.rawDate || a.date) === today).length;
    const completedCount = appointments.filter(a => a.status === "completed").length;
    
    // Calculate Avg Rating
    const ratings = appointments.filter(a => a.rating > 0).map(a => a.rating);
    const avgRating = ratings.length > 0 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
      : "0.0";

    return {
      totalBookings: totalBookings,
      todayBookings: todayCount,
      completed: completedCount,
      avgRating: avgRating
    };
  }, [appointments]);

  const stats = [
    { icon: <ClipboardList size={24} />, label: t("doctor_dashboard.total_bookings"), value: metrics.totalBookings, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: <Calendar size={24} />, label: t("doctor_dashboard.todays_bookings"), value: metrics.todayBookings, color: "text-indigo-600", bg: "bg-indigo-50" },
    { icon: <Star size={24} />, label: t("doctor_dashboard.avg_rating"), value: metrics.avgRating, color: "text-amber-600", bg: "bg-amber-50" },
    { icon: <Check size={24} />, label: t("doctor_dashboard.completed"), value: metrics.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      
      {/*  PREMIUM HERO SECTION */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200/50 group">
        <div className="relative z-10 flex flex-col xl:flex-row items-center gap-12">
          <div className="flex-1 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
              <Heart size={14} className="text-red-400 fill-red-400" />
              {t("doctor_dashboard.dedication_note")}
            </div>
            <h3 className="text-4xl md:text-[3.1rem] font-black leading-[1] tracking-tighter max-w-2xl">
              {t('doctor_dashboard.hero_title')}
            </h3>
            <p className="text-blue-100 text-xl font-medium leading-relaxed max-w-lg opacity-90">
              {t("doctor_dashboard.schedule_status", { count: metrics.todayBookings })}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onViewSchedule}
                className="bg-white text-blue-800 px-10 py-5 rounded-2xl font-black text-lg hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95"
              >
                <ClipboardList size={22} />
                {t('doctor_dashboard.view_schedule')}
              </button>
            </div>
          </div>
          
          <div className="hidden xl:flex w-72 h-72 bg-gradient-to-tr from-white/20 to-white/5 rounded-[4rem] backdrop-blur-xl border border-white/20 items-center justify-center rotate-6 shadow-inner group-hover:rotate-12 transition-transform duration-700">
            <div className="bg-white rounded-3xl p-6 shadow-2xl rotate-[-6deg] group-hover:rotate-[-12deg] transition-transform duration-700">
              <Calendar size={80} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        {/* Decorative Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/*  PRACTICE STATS */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{t("doctor_dashboard.performance_overview")}</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
              <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
                {stat.icon}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${stat.bg} opacity-10 rounded-full blur-2xl`}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorOverview;
