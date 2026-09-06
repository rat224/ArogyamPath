import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { logIn, signInWithGoogle, resetPassword } from "../../firebase/services/auth";
import { Eye, EyeOff } from "lucide-react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return re.test(email.toLowerCase());
  };

  const isAllowedDomain = (email) => {
    const allowedDomains = ["@gmail.com", "@outlook.com", "@yahoo.com", "@hotmail.com", "@icloud.com"];
    return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
  };

  useEffect(() => {
    const isEmailValid = validateEmail(formData.email);
    const isDomainValid = formData.email ? isAllowedDomain(formData.email) : true;
    const isPasswordValid = formData.password.length >= 6;

    if (formData.email && !isEmailValid) {
      setEmailError(t("auth.invalidEmail"));
    } else if (formData.email && !isDomainValid) {
      setEmailError(t("auth.untrustedDomain"));
    } else {
      setEmailError("");
    }

    setIsFormValid(isEmailValid && isDomainValid && isPasswordValid);
  }, [formData, t]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    // SET THE KEY BEFORE LOGIN (State Orchestration)
    sessionStorage.setItem("justLoggedIn", "true");

    try {
      setLoading(true);
      await logIn(formData.email.toLowerCase().trim(), formData.password);

      toast.success(t("auth.welcomeBack"));
      navigate("/role-entry", { replace: true });
    } catch (error) {
      sessionStorage.removeItem("justLoggedIn");
      console.error("Login Error:", error.code);
      // SECURITY BEST PRACTICE: Grouping credential errors to prevent account enumeration
      const credentialErrors = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'];

      if (credentialErrors.includes(error.code)) {
        toast.error(t("auth.errorInvalidCredential"));
      } else {
        toast.error(t("auth.errorUnexpected"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error(t("auth.errorEmailRequired"));
      return;
    }
    if (emailError) {
      toast.error(t("auth.invalidEmail"));
      return;
    }

    try {
      setLoading(true);
      await resetPassword(formData.email.trim());
      toast.success(t("auth.resetEmailSent"));
    } catch (error) {
      console.error("Reset Error:", error.code);
      toast.error(t("auth.resetEmailFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    sessionStorage.setItem("justLoggedIn", "true");

    try {
      setLoading(true);
      const result = await signInWithGoogle();
      const user = result.user;

      // Create the user doc if it doesn't exist 
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp()
      }, { merge: true });

      toast.success(t("auth.welcomeBack"));
      navigate("/role-entry", { replace: true });
    } catch (error) {
      sessionStorage.removeItem("justLoggedIn");
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(error.message || t("auth.errorUnexpected"));
      }
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6 animate-in fade-in duration-1000">

        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("auth.login")}
          </h2>
        </div>

        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">{t("auth.email")}</label>
            <input
              type="email"
              required
              placeholder="rahul@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input-standard ${emailError ? "border-red-500 ring-2 ring-red-500/10" : ""}`}
            />
            {emailError && (
              <p className="text-[10px] font-bold text-red-500 animate-in slide-in-from-top-1 duration-300">
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700">{t("auth.password")}</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-green-600 hover:text-green-700"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-standard pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={2.5} />
                ) : (
                  <Eye size={18} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold transition hover:shadow-md h-12 flex items-center justify-center gap-2 ${(!isFormValid || loading) ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
          >
            {loading ? "..." : t("auth.signIn")}
          </button>
        </form>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">OR</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold transition hover:bg-gray-50 h-12"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          {t("auth.continueWithGoogle")}
        </button>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate("/signup")}
            className="text-sm font-semibold text-gray-600 hover:text-green-600 transition"
          >
            {t("auth.noAccountSignUp")}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/auth-choice")}
            className="text-xs font-semibold text-gray-400 hover:text-green-600 transition"
          >
            ← {t("auth.back")}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
