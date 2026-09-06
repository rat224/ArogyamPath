import React from "react";
import { User, Star, MapPin, Building2 } from "lucide-react";

const FindDoctorCard = ({ doc, t, onBook }) => (
  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all overflow-hidden shadow-inner">
          {doc.photoUrl ? (
            <img src={doc.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={28} />
          )}
        </div>
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-wider">
              {t(`profile_setup.spec_${(doc.specialization || doc.specialty || "General Physician").toLowerCase().replace(/\s+/g, '_')}`)}
            </div>
          </div>
          <h4 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors leading-tight text-left">{doc.fullName || doc.name}</h4>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-y border-gray-50 mb-4">
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">{t("patient_appointments.rating")}</span>
          <div className="flex items-center gap-1 mt-0.5 min-h-[16px]">
            {doc.rating !== undefined ? (
              <>
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-gray-700">{Number(doc.rating || 0).toFixed(1)}</span>
                {(!doc.reviewCount || Number(doc.reviewCount) === 0) ? (
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md ml-1.5 uppercase tracking-wider">
                    {t("patient_appointments.new_doctor", "New")}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-gray-400 ml-1">
                    ({doc.reviewCount})
                  </span>
                )}
              </>
            ) : (
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                {t("patient_appointments.new_doctor", "New")}
              </span>
            )}
          </div>
        </div>
        <div className="w-px h-6 bg-gray-100"></div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t("patient_appointments.experience")}</span>
          <span className="text-xs font-black text-gray-700 mt-0.5">{doc.experience || "10 yrs"}</span>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-emerald-500 shrink-0">
            <Building2 size={12} />
          </div>
          <span className="text-[11px] font-bold text-gray-600 truncate">{doc.clinicName || "Arogya Clinic"}</span>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
            <MapPin size={12} />
          </div>
          <span className="text-[10px] font-medium text-gray-400 leading-relaxed line-clamp-2 text-left">{doc.clinicAddress || doc.address}</span>
        </div>
      </div>
    </div>
    <button onClick={() => onBook(doc)} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-gray-200">{t("dashboard.book_appointment")}</button>
  </div>
);

export default React.memo(FindDoctorCard);
