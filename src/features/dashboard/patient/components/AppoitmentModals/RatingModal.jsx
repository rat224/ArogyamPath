import React from "react";
import { Star, X } from "lucide-react";

const RatingModal = ({ isOpen, onClose, ratingValue, setRatingValue, hoverRating, setHoverRating, onSubmit, t }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer animate-in fade-in duration-300"
        >
          <X size={18} />
        </button>
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <Star size={32} className="fill-amber-600" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900">{t("patient_appointments.rate_visit")}</h3>
          <p className="text-gray-500 text-xs font-medium mt-1">{t("patient_appointments.rate_desc")}</p>
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRatingValue(s)}
            >
              <Star
                size={36}
                className={`${(hoverRating || ratingValue) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} transition-colors`}
              />
            </button>
          ))}
        </div>
        <button onClick={onSubmit} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black">
          {t("patient_appointments.submit_review")}
        </button>
      </div>
    </div>
  );
};

export default React.memo(RatingModal);
