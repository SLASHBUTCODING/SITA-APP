import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, User, Lock, Eye, EyeOff } from "lucide-react";
import { authApi, saveAuth } from "../../services/api";

export function DriverLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.driverLogin(formData);
      saveAuth(res.token, res.driver, "driver");
      navigate("/driver/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a2e] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F47920] to-[#F47920]/90 pt-12 pb-8 px-5 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center mt-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🛺</span>
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">Log in sa SITA</h1>
          <p className="text-white/80 text-sm">Welcome back, Driver!</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-5 pb-24">
        <form onSubmit={handleSubmit} className="py-6 space-y-4">
          {error && (
            <div className="bg-red-50/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="text-white/90 text-sm font-semibold mb-2 block">
              Mobile Number <span className="text-[#F47920]">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="tel"
                required
                placeholder="+63 912 345 6789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-white placeholder-white/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-white/90 text-sm font-semibold mb-2 block">
              Password <span className="text-[#F47920]">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-white placeholder-white/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/driver/forgot-password")}
              className="text-sm text-[#F47920] font-medium"
            >
              Nakalimot ang password?
            </button>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47920] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 mt-6 disabled:opacity-60"
          >
            {loading ? "Nag-log in..." : "Mag-Log In"}
          </motion.button>

          {/* Signup Link */}
          <p className="text-center text-sm text-white/60 mt-4">
            Wala pang account?{" "}
            <button
              type="button"
              onClick={() => navigate("/driver/signup")}
              className="text-[#F47920] font-semibold"
            >
              Mag-Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
