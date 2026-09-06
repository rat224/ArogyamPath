import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../../../firebase/config";
import { useAuth } from "../../../../context/AuthContext";
import { User, Phone, MapPin, Activity, Camera, Mail } from "lucide-react";

const PatientProfileUpdate = ({ existingData }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const role = "patient";
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(existingData?.photoUrl || null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: existingData?.fullName || "",
    phone: existingData?.phone || "",
    age: existingData?.age || "",
    gender: existingData?.gender || "",
    bloodGroup: existingData?.bloodGroup || "",
    location: existingData?.location || "",
  });

  // IMAGE COMPRESSION LOGIC
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions for profile pic
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Quality 0.7 is perfect balance
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const compressed = await compressImage(file);
        setImage(compressed);
        setPreview(URL.createObjectURL(compressed));
        if (errors.photo) setErrors({ ...errors, photo: null });
      } catch (err) {
        console.error("Patient profile image compression failed:", err);
        toast.error(t("profile_setup.failed_image") || "Failed to process image");
      } finally {
        setLoading(false);
      }
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    if (!preview && !image) newErrors.photo = t("profile_setup.error_photo");
    if (!data.fullName.trim() || data.fullName.trim().length < 3 || !/^[a-zA-Z\s]+$/.test(data.fullName)) {
      newErrors.fullName = t("profile_setup.error_name");
    }
    if (!data.phone.trim() || !/^[6-9]\d{9}$/.test(data.phone)) newErrors.phone = t("profile_setup.error_phone");
    if (!data.location.trim() || data.location.trim().length < 3 || !/^[a-zA-Z\s,]+$/.test(data.location)) {
      newErrors.location = t("profile_setup.error_location");
    }

    const ageNum = parseInt(data.age);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) newErrors.age = t("profile_setup.error_age");
    if (!data.gender) newErrors.gender = t("profile_setup.error_gender");
    if (!data.bloodGroup) newErrors.bloodGroup = t("profile_setup.error_blood_group");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "arogyapath_preset");
    formData.append("cloud_name", "dgpeicnzd");

    const response = await fetch(`https://api.cloudinary.com/v1_1/dgpeicnzd/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return toast.error(t("profile_setup.error_fix"));

    try {
      setLoading(true);
      let photoUrl = preview;
      if (image) {
        toast.loading(t("profile_setup.uploading_photo") || "Uploading photo...", { id: "uploading" });
        photoUrl = await uploadImageToCloudinary(image);
        toast.dismiss("uploading");
      }
      
      const profileData = {
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        photoUrl: photoUrl || "",
        role: role,
        uid: currentUser.uid,
        email: currentUser.email,
        createdAt: existingData?.createdAt || new Date().toISOString(),
        age: formData.age,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup
      };

      await setDoc(doc(db, "patients", currentUser.uid), profileData);
      
      await setDoc(doc(db, "users", currentUser.uid), {
        fullName: profileData.fullName,
        photoUrl: photoUrl,
        onboardingComplete: true,
        completedRoles: arrayUnion(role)
      }, { merge: true });
        
      toast.success(t("profile_setup.success"));
    } catch (error) {
      console.error("Patient profile save failed:", error);
      toast.error(t("auth.errorUnexpected"));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
          <div className="relative group">
            <div className={`
              w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 transition-all duration-300
              ${errors.photo ? 'border-red-500' : 'border-emerald-50'}
            `}>
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={60} className="text-gray-200" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-3 rounded-2xl text-white cursor-pointer shadow-lg hover:scale-110 transition-transform bg-emerald-600">
              <Camera size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="text-center md:text-left space-y-2">
            <h3 className="text-3xl font-black leading-tight text-emerald-600">
              {t("profile_setup.edit_profile")}
            </h3>
            <p className="text-gray-400 font-medium italic">{t("profile_setup.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User size={16} className="text-gray-400" /> {t("profile_setup.full_name")}
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`input-standard ${errors.fullName ? 'border-red-500' : ''}`}
            />
            {errors.fullName && <p className="text-xs text-red-500 font-medium">{errors.fullName}</p>}
          </div>

          <div className="md:col-span-2 space-y-1 opacity-60">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" /> {t("profile_setup.email")}
            </label>
            <input type="email" value={currentUser?.email || ""} readOnly className="input-standard bg-gray-50 cursor-not-allowed" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Phone size={16} className="text-gray-400" /> {t("profile_setup.phone")}
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`input-standard ${errors.phone ? 'border-red-500' : ''}`}
            />
            {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" /> {t("profile_setup.location")}
            </label>
            <input
              type="text"
              name="location"
              spellCheck="false"
              value={formData.location}
              onChange={handleInputChange}
              className={`input-standard ${errors.location ? 'border-red-500' : ''}`}
            />
            {errors.location && <p className="text-xs text-red-500 font-medium">{errors.location}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">{t("profile_setup.age")}</label>
            <input type="number" name="age" value={formData.age} onChange={handleInputChange} className={`input-standard ${errors.age ? 'border-red-500' : ''}`} />
            {errors.age && <p className="text-xs text-red-500 font-medium">{errors.age}</p>}
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">{t("profile_setup.gender")}</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className={`input-standard ${errors.gender ? 'border-red-500' : ''}`}>
              <option value="">{t("profile_setup.select")}</option>
              <option value="male">{t("profile_setup.gender_male")}</option>
              <option value="female">{t("profile_setup.gender_female")}</option>
              <option value="other">{t("profile_setup.gender_other")}</option>
            </select>
            {errors.gender && <p className="text-xs text-red-500 font-medium">{errors.gender}</p>}
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Activity size={16} className="text-gray-400" /> {t("profile_setup.blood_group")}
            </label>
            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className={`input-standard ${errors.bloodGroup ? 'border-red-500' : ''}`}>
              <option value="">{t("profile_setup.select")}</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              <option value="unknown">{t("profile_setup.blood_group_unknown")}</option>
            </select>
            {errors.bloodGroup && <p className="text-xs text-red-500 font-medium">{errors.bloodGroup}</p>}
          </div>

          <div className="md:col-span-2 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-[0.98] bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"
            >
              {loading ? "..." : t("profile_setup.save_profile")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfileUpdate;
