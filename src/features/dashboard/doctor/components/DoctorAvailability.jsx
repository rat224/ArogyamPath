import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, AlertCircle, Save, CheckCircle2, Copy, Trash2, Plus, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../../context/AuthContext";
import { db } from "../../../../firebase/config";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

//  Premium 12-Hour Time Picker Component (Instant)
const TimePickerInput = React.memo(({ value, onChange, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const formatDisplay = (time24) => {
    if (!time24) return "10:00 AM";
    let [h, m] = time24.split(':');
    h = parseInt(h, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const handleSelect = (h12, m, ampm) => {
    let h24 = parseInt(h12, 10);
    if (ampm === 'PM' && h24 < 12) h24 += 12;
    if (ampm === 'AM' && h24 === 12) h24 = 0;
    onChange(`${h24.toString().padStart(2, '0')}:${m}`);
    setIsOpen(false);
  };

  useEffect(() => {
    const clickAway = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", clickAway);
    return () => document.removeEventListener("mousedown", clickAway);
  }, []);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"]; 
  const [currH, currM] = (value || "10:00").split(':');
  const isPM = parseInt(currH, 10) >= 12;
  const dispH = (parseInt(currH, 10) % 12 || 12).toString().padStart(2, '0');

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all focus:outline-none min-w-[75px]"
      >
        {formatDisplay(value)}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 mt-3 z-[150] bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-4 flex gap-4 animate-in fade-in sm:zoom-in-95 slide-in-from-top-2 sm:slide-in-from-top-0 duration-200">
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
            <span className="text-[8px] font-black text-gray-300 uppercase text-center mb-1">{t ? t("doctor_availability.hour") : "Hour"}</span>
            {hours.map(h => (
              <button key={h} onClick={() => handleSelect(h, currM, isPM ? 'PM' : 'AM')} className={`px-3 py-2 rounded-xl text-[10px] font-black ${dispH === h ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-500'}`}>{h}</button>
            ))}
          </div>
          <div className="flex flex-col gap-1 pr-1">
            <span className="text-[8px] font-black text-gray-300 uppercase text-center mb-1">{t ? t("doctor_availability.min") : "Min"}</span>
            {minutes.map(m => (
              <button key={m} onClick={() => handleSelect(dispH, m, isPM ? 'PM' : 'AM')} className={`px-3 py-2 rounded-xl text-[10px] font-black ${currM === m ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-gray-50 text-gray-500'}`}>{m}</button>
            ))}
          </div>
          <div className="flex flex-col gap-1 border-l border-gray-100 pl-3">
            <span className="text-[8px] font-black text-gray-300 uppercase text-center mb-1">{t ? t("doctor_availability.day") : "Day"}</span>
            <button onClick={() => handleSelect(dispH, currM, 'AM')} className={`px-3 py-2 rounded-xl text-[10px] font-black ${!isPM ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'hover:bg-gray-50 text-gray-500'}`}>AM</button>
            <button onClick={() => handleSelect(dispH, currM, 'PM')} className={`px-3 py-2 rounded-xl text-[10px] font-black ${isPM ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'hover:bg-gray-50 text-gray-500'}`}>PM</button>
          </div>
        </div>
      )}
    </div>
  );
});


const DoctorAvailability = ({ t }) => {
  const { currentUser } = useAuth();
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: "Monday", slots: [] },
    { day: "Tuesday", slots: [] },
    { day: "Wednesday", slots: [] },
    { day: "Thursday", slots: [] },
    { day: "Friday", slots: [] },
    { day: "Saturday", slots: [] },
    { day: "Sunday", slots: [] },
  ]);

  const [slotDuration, setSlotDuration] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedDates, setBlockedDates] = useState([]); // 🏖️ Vacation Dates
  const [newHoliday, setNewHoliday] = useState("");

  //  Fetch Availability from Database
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, "availability", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.weeklySchedule) setWeeklySchedule(data.weeklySchedule);
          if (data.blockedDates) setBlockedDates(data.blockedDates);
          if (data.slotDuration) setSlotDuration(data.slotDuration);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        toast.error(t("doctor_availability.load_failed") || "Failed to load your schedule");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [currentUser, t]);

  const nextDates = React.useMemo(() => {
    const dates = [];
    const today = new Date();
    const getLocalDateStr = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      dates.push({
        dayName: nextDate.toLocaleDateString('en-US', { weekday: 'long' }),
        dateStr: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: getLocalDateStr(nextDate),
        isToday: i === 0
      });
    }
    return dates;
  }, []);

  const handleTimeChange = (dayIndex, slotIndex, field, value) => {
    setWeeklySchedule(prev => prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      return {
        ...day,
        slots: day.slots.map((slot, sIdx) => {
          if (sIdx !== slotIndex) return slot;
          return { ...slot, [field]: value };
        })
      };
    }));
  };

  const addSlot = (dayIndex) => {
    setWeeklySchedule(prev => prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      return {
        ...day,
        slots: [...day.slots, { start: "10:00", end: "18:00" }]
      };
    }));
  };

  const removeSlot = async (dayIndex, slotIndex) => {
    const day = weeklySchedule[dayIndex];
    const slot = day.slots[slotIndex];
    
    //  Pre-deletion check for active bookings in this specific slot
    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", currentUser.uid),
        where("status", "==", "upcoming")
      );
      
      const querySnapshot = await getDocs(q);
      const allActiveAppts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter to find only those that match both the day of the week and the time range
      const slotConflicts = allActiveAppts.filter(app => {
        //  Check Day of Week
        const dateParts = (app.rawDate || app.date).split("-");
        let appDate;
        if (dateParts.length === 3) {
          appDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        } else {
          appDate = new Date(app.rawDate || app.date);
        }
        
        const appDayName = appDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (appDayName !== day.day) return false;

        //  Check Time Range (Is the appointment inside this slot?)
        const appTime24 = to24h(app.time);
        // Condition: appTime is between slot.start (inclusive) and slot.end (exclusive)
        return appTime24 >= slot.start && appTime24 < slot.end;
      }).map(app => ({ ...app, reason: "Time slot has active bookings" }));

      if (slotConflicts.length > 0) {
        setConflicts(slotConflicts);
        setShowWarning(true);
        return; 
      }
    } catch (error) {
      console.error("Conflict check failed:", error);
    }

    setWeeklySchedule(prev => prev.map((day, dIdx) => {
      if (dIdx !== dayIndex) return day;
      return {
        ...day,
        slots: day.slots.filter((_, sIdx) => sIdx !== slotIndex)
      };
    }));
  };

  const handleAddHoliday = async () => {
    if (!newHoliday) return toast.error(t("doctor_availability.select_date") || "Please select a date");
    if (blockedDates.includes(newHoliday)) return toast.error(t("doctor_availability.date_blocked") || "Date already blocked");
    
    const newDates = [...blockedDates, newHoliday].sort();
    
    //  Pre-save conflict check
    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", currentUser.uid),
      where("status", "==", "upcoming"),
      where("rawDate", "==", newHoliday)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const foundConflicts = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        reason: "Date is now a Holiday" 
      }));
      setConflicts(foundConflicts);
      setShowWarning(true);
      return;
    }

    try {
      const docRef = doc(db, "availability", currentUser.uid);
      await setDoc(docRef, { blockedDates: newDates }, { merge: true });
      setBlockedDates(newDates);
      setNewHoliday("");
      toast.success(t("doctor_availability.holiday_saved") || "Holiday saved successfully!", { icon: '🏖️' });
    } catch (error) {
      console.error("Save holiday failed:", error);
      toast.error(t("doctor_availability.holiday_failed") || "Failed to save holiday");
    }
  };

  const removeHoliday = async (date) => {
    const newDates = blockedDates.filter(d => d !== date);
    try {
      const docRef = doc(db, "availability", currentUser.uid);
      await setDoc(docRef, { blockedDates: newDates }, { merge: true });
      setBlockedDates(newDates);
      toast.success(t("doctor_availability.date_unblocked") || "Date unblocked and saved!");
    } catch (error) {
      console.error("Remove holiday failed:", error);
      toast.error(t("doctor_availability.update_failed") || "Failed to update schedule");
    }
  };

  const applySmartAll = () => {
    const sourceDay = weeklySchedule.find(d => d.slots.length > 0);
    if (!sourceDay) return toast.error(t("doctor_availability.add_slot_first") || "Please add slots to at least one day first");

    setWeeklySchedule(prev => prev.map(day => ({
      ...day,
      slots: [...sourceDay.slots]
    })));

    toast.success(t("doctor_availability.applied_to_all") || `Applied ${sourceDay.day}'s schedule to all days!`);
  };

  const [conflicts, setConflicts] = useState([]);
  const [showWarning, setShowWarning] = useState(false);



  //  Helper: Convert 12h (10:30 AM) to 24h (10:30)
  const to24h = (time12h) => {
    if (!time12h) return "";
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };
  //  Check for Booked Appointment Conflicts
  const checkForConflicts = async () => {
    if (!currentUser) return [];
    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", currentUser.uid),
        where("status", "==", "upcoming")
      );
      const querySnapshot = await getDocs(q);
      const upcomingAppts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const foundConflicts = upcomingAppts.map(app => {
        const appDateKey = app.rawDate || app.date;
        // 1. Check if date is blocked (Vacation Mode)
        if (blockedDates.includes(appDateKey)) {
          return { ...app, reason: "Date is now a Holiday" };
        }

        // 2. Check if time is in any available slot for that day
        const dayName = new Date(app.date).toLocaleDateString('en-US', { weekday: 'long' });
        const daySchedule = weeklySchedule.find(d => d.day === dayName);
        
        if (!daySchedule || daySchedule.slots.length === 0) {
          return { ...app, reason: "Day is now Unavailable" };
        }

        const appTime24 = to24h(app.time);
        const isInSlot = daySchedule.slots.some(slot => 
          appTime24 >= slot.start && appTime24 < slot.end
        );

        if (!isInSlot) {
          return { ...app, reason: "Time slot was removed" };
        }

        return null;
      }).filter(Boolean);

      return foundConflicts;
    } catch (error) {
      console.error("Error checking conflicts:", error);
      return [];
    }
  };

  const handleSave = async (force = false) => {
    if (!currentUser) return toast.error(t("doctor_availability.login_first") || "Please login first");
    
    //  Validate NO Overlapping Slots in the schedule itself
    for (const day of weeklySchedule) {
      const sorted = [...day.slots].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].end > sorted[i + 1].start) {
          return toast.error(t("doctor_availability.overlap_error") || `Overlapping slots detected on ${day.day}! Please fix them before saving.`, {
            icon: '⚠️',
            duration: 4000
          });
        }
      }
    }

    setIsSaving(true);
    
    if (!force) {
      const foundConflicts = await checkForConflicts();
      if (foundConflicts.length > 0) {
        setConflicts(foundConflicts);
        setShowWarning(true);
        setIsSaving(false);
        return;
      }
    }

    try {
      const docRef = doc(db, "availability", currentUser.uid);
      await setDoc(docRef, {
        weeklySchedule,
        blockedDates,
        slotDuration,
        updatedAt: new Date().toISOString(),
        doctorId: currentUser.uid
      }, { merge: true });

      toast.success(t("doctor_availability.availability_updated") || "Availability updated successfully!", {
        icon: '✅',
        duration: 3000
      });
      setShowWarning(false);
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error(t("doctor_availability.save_failed") || "Failed to save schedule. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing with Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-20">

      {/*  HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <Calendar size={24} />
            </div>
            {t("doctor_availability.title")}
          </h2>
          <p className="text-gray-400 font-bold text-sm ml-12">{t("doctor_availability.subtitle")}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 hover:shadow-blue-200'}`}
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
          {isSaving ? t("doctor_availability.saving") : t("doctor_availability.save_schedule")}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/*  WEEKLY SCHEDULE LIST */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("doctor_availability.weekly_timeline")}</h3>
            <button
              onClick={applySmartAll}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              <Copy size={14} />
              {t("doctor_availability.apply_all")}
            </button>
          </div>

          <div className="space-y-3">
            {nextDates.map((dateInfo) => {
              const dayIndex = weeklySchedule.findIndex(d => d.day === dateInfo.dayName);
              const day = weeklySchedule[dayIndex];
              const isBlocked = blockedDates.includes(dateInfo.fullDate);
              const isActive = day.slots.length > 0;

              return (
                <div
                  key={dateInfo.dayName}
                  className={`group flex flex-col p-5 rounded-[2.5rem] border transition-all relative ${isBlocked ? 'bg-amber-50/30 border-amber-100 opacity-80' : isActive ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50/50 border-transparent opacity-60'}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/*  Day & Add Button Section */}
                    <div className="flex items-center gap-4 shrink-0 lg:w-[280px]">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-inner ${isBlocked ? 'bg-amber-100 text-amber-600' : isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {isBlocked ? <AlertCircle size={18} /> : isActive ? <Clock size={18} /> : <Calendar size={18} />}
                      </div>
                      <div className="text-left flex-1 min-w-[140px]">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-black text-gray-900 leading-none">{t(`days.${dateInfo.dayName}`) || dateInfo.dayName}</p>
                          {dateInfo.isToday && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse">{t("doctor_availability.today")}</span>
                          )}
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isBlocked ? 'text-amber-500' : isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                          {dateInfo.dateStr} • {isBlocked ? t("doctor_availability.on_leave") : isActive ? t("doctor_availability.available") : t("doctor_availability.not_set")}
                        </p>
                      </div>
                      {!isBlocked && (
                        <button
                          onClick={() => addSlot(dayIndex)}
                          className="flex items-center gap-2 px-2 py-1 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                        >
                          <Plus size={14} /> {t("doctor_availability.add_slot")}
                        </button>
                      )}
                    </div>

                    {/*  Slots Section (Strict Boundaries) */}
                    {!isBlocked && isActive && (
                      <div className="flex-1 flex flex-wrap items-center gap-2 pr-6">
                        {day.slots.map((slot, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 group/slot animate-in fade-in slide-in-from-right-2">
                            {/* Time Pill (Only Time) */}
                            <div className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-100 rounded-[1.2rem] group-hover/slot:border-blue-100 group-hover/slot:bg-white transition-all shadow-inner relative">
                              <TimePickerInput 
                                value={slot.start} 
                                onChange={(val) => handleTimeChange(dayIndex, sIdx, 'start', val)} 
                                t={t}
                              />
                              <span className="text-gray-300 font-black text-[9px] uppercase tracking-tighter">{t("doctor_availability.to")}</span>
                              <TimePickerInput 
                                value={slot.end} 
                                onChange={(val) => handleTimeChange(dayIndex, sIdx, 'end', val)} 
                                t={t}
                              />
                            </div>
                            {/* Separate Trash Button */}
                            <button
                              onClick={() => removeSlot(dayIndex, sIdx)}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Remove Slot"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isBlocked && (
                      <div className="flex-1 flex items-center gap-2 text-amber-600 italic">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t("doctor_availability.holiday_mode")}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/*  QUICK SETTINGS */}
        <div className="space-y-8">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-700"></div>

            <div className="space-y-2">
              <h4 className="text-lg font-black tracking-tight">{t("doctor_availability.slot_settings_title")}</h4>
              <p className="text-gray-400 text-xs font-bold leading-relaxed">{t("doctor_availability.slot_settings_desc")}</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">{t("doctor_availability.duration")}</span>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full mt-2 bg-white/10 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value={15} className="bg-gray-900">{t("doctor_availability.15_min")}</option>
                  <option value={30} className="bg-gray-900">{t("doctor_availability.30_min")}</option>
                  <option value={45} className="bg-gray-900">{t("doctor_availability.45_min")}</option>
                  <option value={60} className="bg-gray-900">{t("doctor_availability.1_hour")}</option>
                </select>
              </label>

              <div className="p-5 bg-white/5 border border-white/5 rounded-[2rem] space-y-3">
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t("doctor_availability.auto_gen_on")}</span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                  {t("doctor_availability.auto_gen_desc")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-lg font-black text-gray-900 leading-none">{t("doctor_availability.vacation_title")}</h4>
                <p className="text-[10px] text-gray-400 font-bold tracking-tight">{t("doctor_availability.vacation_desc")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <input
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                min={(() => {
                  const d = new Date();
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })()}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                onClick={handleAddHoliday}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 active:scale-95 transition-all"
              >
                {t("doctor_availability.block_date")}
              </button>
            </div>

            {blockedDates.length > 0 && (
              <div className="pt-4 space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("doctor_availability.planned_holidays")}</p>
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1">
                  {blockedDates.map(date => (
                    <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-black text-gray-700">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <button onClick={() => removeHoliday(date)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
      {/*  CONFLICT WARNING MODAL */}
      {showWarning && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                <AlertCircle size={44} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-900 leading-tight">{t("doctor_availability.conflict_title")}</h3>
                <p className="text-gray-500 font-bold text-sm">
                  {t("doctor_availability.conflict_desc")}
                </p>
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-4 pr-2 scrollbar-hide">
              {conflicts.map((app, idx) => (
                <div key={idx} className="flex flex-col p-5 bg-gray-50/50 border border-gray-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:border-red-100 transition-all group/item relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm group-hover/item:text-red-500 transition-colors">
                        <User size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-900 leading-tight">{app.patientName || "Patient"}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{app.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-black text-gray-900">{app.time}</span>
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5 px-2 py-0.5 bg-red-50 rounded-md border border-red-100">Conflict</span>
                    </div>
                  </div>
                  
                  {/*  Conflict Reason Badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                    <AlertCircle size={12} className="text-amber-500" />
                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">
                      {t("doctor_availability.reason")} {app.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setShowWarning(false)}
                className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 shadow-xl shadow-gray-200 transition-all active:scale-95"
              >
                {t("doctor_availability.review_conflicts")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability;
