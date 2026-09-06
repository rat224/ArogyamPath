import React, { useState, useCallback } from "react";
import { X, Building2, Video, Loader2, CheckCircle2, Hash, Phone, MapPin, Users, User } from "lucide-react";

const BookingModal = ({ 
  isOpen, onClose, bookingStep, selectedDoctor, consultationMode, setConsultationMode,
  availableDates, selectedDate, setSelectedDate, doctorSlots, selectedSlot, setSelectedSlot,
  isProcessing, confirmBooking, currentBookingId, t,
  bookingFor, setBookingFor, familyMember, setFamilyMember
}) => {
  const [formError, setFormError] = useState("");

  const handleFamilyProceed = useCallback(() => {
    if (!familyMember.name.trim() || familyMember.name.trim().length < 3 || !/^[a-zA-Z\s]+$/.test(familyMember.name)) {
      return setFormError(t("profile_setup.error_name"));
    }
    const age = Number(familyMember.age);
    if (!familyMember.age || isNaN(age) || age < 1 || age > 120) {
      return setFormError(t("profile_setup.error_age"));
    }
    if (!familyMember.phone.trim() || !/^[6-9]\d{9}$/.test(familyMember.phone)) {
      return setFormError(t("profile_setup.error_phone"));
    }
    setFormError("");
    confirmBooking("proceed_to_step1");
  }, [familyMember, confirmBooking, t]);

  //  Fix 3: Reset formError when modal closes
  const handleClose = useCallback(() => {
    setFormError("");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // Who is this appointment for
  if (bookingStep === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative animate-in sm:zoom-in-95 slide-in-from-bottom-full sm:slide-in-from-bottom-0 max-h-[90vh] overflow-y-auto scrollbar-hide">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-black text-gray-900">{t("patient_appointments.appointment_for_title")}</h3>
              <p className="text-xs font-bold text-gray-400 mt-0.5">{t("patient_appointments.appointment_for_subtitle")}</p>
            </div>
            <button onClick={handleClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500">
              <X size={20} />
            </button>
          </div>

          {/* Myself / Family Member selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => { setBookingFor("myself"); setFormError(""); }}
              className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all font-black text-sm ${
                bookingFor === "myself"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                  : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bookingFor === "myself" ? "bg-emerald-100" : "bg-gray-100"}`}>
                <User size={22} className={bookingFor === "myself" ? "text-emerald-600" : "text-gray-400"} />
              </div>
              <span>{t("patient_appointments.myself")}</span>
              {bookingFor === "myself" && (
                <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{t("patient_appointments.selected_badge")}</span>
              )}
            </button>

            <button
              onClick={() => { setBookingFor("family"); setFormError(""); }}
              className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all font-black text-sm ${
                bookingFor === "family"
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bookingFor === "family" ? "bg-blue-100" : "bg-gray-100"}`}>
                <Users size={22} className={bookingFor === "family" ? "text-blue-600" : "text-gray-400"} />
              </div>
              <span>{t("patient_appointments.family_member")}</span>
              {bookingFor === "family" && (
                <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">{t("patient_appointments.selected_badge")}</span>
              )}
            </button>
          </div>

          {/* Family Member Form — only shown when "family" is selected */}
          {bookingFor === "family" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 mb-4">
              <div className="h-px bg-gray-100 my-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("patient_appointments.member_details")}</p>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.full_name_label")}</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={familyMember.name}
                  onChange={(e) => { setFamilyMember(p => ({ ...p, name: e.target.value })); setFormError(""); }}
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.age_label")}</label>
                  <input
                    type="number"
                    placeholder="e.g. 8"
                    min="1"
                    max="120"
                    value={familyMember.age}
                    onChange={(e) => { setFamilyMember(p => ({ ...p, age: e.target.value })); setFormError(""); }}
                    className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.gender_label")}</label>
                  <select
                    value={familyMember.gender}
                    onChange={(e) => { setFamilyMember(p => ({ ...p, gender: e.target.value })); setFormError(""); }}
                    className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all bg-white"
                  >
                    <option value="Male">{t("profile_setup.gender_male")}</option>
                    <option value="Female">{t("profile_setup.gender_female")}</option>
                    <option value="Other">{t("profile_setup.gender_other")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.mobile_number_label")}</label>
                <input
                  type="tel"
                  maxLength="10"
                  inputMode="numeric"
                  placeholder="e.g. 9876543210"
                  value={familyMember.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFamilyMember(p => ({ ...p, phone: digitsOnly }));
                    setFormError("");
                  }}
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                />
              </div>

              {formError && (
                <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl border border-red-100 animate-in fade-in">
                  ⚠️ {formError}
                </p>
              )}
            </div>
          )}

          <button
            onClick={bookingFor === "myself" ? () => confirmBooking("proceed_to_step1") : handleFamilyProceed}
            className="w-full py-5 rounded-2xl font-black text-base shadow-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all"
          >
            {t("patient_appointments.continue_btn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in sm:zoom-in-95 slide-in-from-bottom-full sm:slide-in-from-bottom-0 max-h-[90vh] overflow-y-auto scrollbar-hide">
        {bookingStep === 1 ? (
          <div className="space-y-5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900">{t("patient_appointments.confirm_appointment")}</h3>
              <button onClick={handleClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.consultation_mode")}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConsultationMode("clinic")}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs ${consultationMode === "clinic" ? 'bg-emerald-50 border-emerald-600 text-emerald-700' : 'bg-white border-gray-100 text-gray-500'}`}
                >
                  <Building2 size={18} /> {t("patient_appointments.clinic_visit")}
                </button>
                <button
                  onClick={() => setConsultationMode("video")}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs ${consultationMode === "video" ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-100 text-gray-500'}`}
                >
                  <Video size={18} /> {t("patient_appointments.online_video")}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.select_date")}</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {availableDates.map(d => (
                  <button
                    key={d.full}
                    onClick={() => setSelectedDate(d.full)}
                    className={`flex flex-col items-center min-w-[75px] py-4 rounded-2xl border-2 transition-all ${selectedDate === d.full ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100'}`}
                  >
                    <span className="text-[9px] font-black uppercase mb-1">{d.day}</span>
                    <span className="text-xl font-black">{d.date}</span>
                    <span className="text-[9px] font-bold opacity-60">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t("patient_appointments.select_time")}</p>
              <div className="grid grid-cols-2 gap-2">
                {doctorSlots.length > 0 ? (
                  doctorSlots.map(s => (
                    <button
                      key={s.time}
                      onClick={() => !s.isBooked && setSelectedSlot(s.time)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between ${s.isBooked ? 'bg-red-50 border-red-100 text-red-300 cursor-not-allowed opacity-80' : selectedSlot === s.time ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200'}`}
                    >
                      {s.time}
                      {s.isBooked && <span className="text-[8px] font-black uppercase tracking-tighter bg-red-100 px-1.5 py-0.5 rounded text-red-500">{t("patient_appointments.taken")}</span>}
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-8 bg-gray-50 rounded-2xl text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t("patient_appointments.no_slots")}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={confirmBooking}
              disabled={!selectedSlot || isProcessing}
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${selectedSlot && !isProcessing ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/10' : 'bg-gray-100 text-gray-400'}`}
            >
              {isProcessing && <Loader2 size={20} className="animate-spin" />}
              {isProcessing ? t("patient_appointments.confirming") : t("patient_appointments.confirm")}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in duration-500">
              <CheckCircle2 size={50} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-gray-900">{t("patient_appointments.booking_confirmed")}</h3>
              <p className="text-gray-500 font-medium">{t("patient_appointments.appointment_with")} <span className="font-bold text-gray-900">{selectedDoctor?.fullName || selectedDoctor?.name}</span> {t("patient_appointments.is_confirmed")}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4 border border-gray-100 text-left">
              <div className="flex items-center justify-between text-xs font-bold border-b border-gray-200 pb-3">
                <span className="text-gray-400 flex items-center gap-2"><Hash size={14} /> {t("patient_appointments.booking_id")}</span>
                <span className="text-emerald-600 font-black tracking-widest">{currentBookingId}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">{t("patient_appointments.date_time")}</span>
                  <span className="text-gray-900">{selectedDate}, {selectedSlot}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">{t("patient_appointments.consultation_mode")}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] ${consultationMode === 'clinic' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {consultationMode === 'clinic' ? t("patient_appointments.clinic_visit") : t("patient_appointments.video_consultation")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">{t("patient_appointments.clinic_name")}</span>
                  <span className="text-gray-900">{selectedDoctor?.clinicName}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-gray-100 mt-2">
                  <span className="text-gray-400 flex items-center gap-2"><Phone size={14} className="text-blue-500" /> {t("patient_appointments.contact_doctor")}</span>
                  <span className="text-gray-900 font-black">{selectedDoctor?.doctorPhone || selectedDoctor?.phone || "N/A"}</span>
                </div>
                <div className="flex items-start justify-between text-xs font-bold pt-1">
                  <span className="text-gray-400 flex items-center gap-2 shrink-0"><MapPin size={14} className="text-emerald-500" /> {t("patient_appointments.clinic_address")}</span>
                  <span className="text-gray-900 text-right leading-relaxed max-w-[60%]">{selectedDoctor?.clinicAddress || selectedDoctor?.address}</span>
                </div>
              </div>
            </div>
            <button onClick={handleClose} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black hover:bg-emerald-600 transition-all active:scale-95">
              {t("patient_appointments.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(BookingModal);
