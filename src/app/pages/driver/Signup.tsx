import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, Upload, FileText, CheckCircle, Clock, Shield } from "lucide-react";
import { authApi, saveAuth } from "../../services/api";
import { supabase } from "../../../lib/supabase";
import { uploadDriverDoc, validateDocFile, type DriverDocKind } from "../../../services/driverDocs";

export function DriverSignup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [nbiFile, setNbiFile] = useState<File | null>(null);
  const [barangayFile, setBarangayFile] = useState<File | null>(null);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    plateNumber: "",
    vehicleModel: "",
    vehicleColor: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileErrors, setFileErrors] = useState<Partial<Record<DriverDocKind, string>>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: DriverDocKind) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const err = validateDocFile(file);
    if (err) {
      setFileErrors((prev) => ({ ...prev, [type]: err }));
      e.target.value = "";
      return;
    }
    setFileErrors((prev) => ({ ...prev, [type]: undefined }));
    switch (type) {
      case 'license': setLicenseFile(file); break;
      case 'nbi': setNbiFile(file); break;
      case 'barangay': setBarangayFile(file); break;
      case 'medical': setMedicalFile(file); break;
    }
  };

  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.driverRegister(formData);
      saveAuth(res.token, res.driver, "driver");

      const driverId = (res.driver as { id?: string } | null)?.id;
      if (!driverId) throw new Error("Registration succeeded but driver id was missing.");

      const uploads: Array<Promise<[DriverDocKind, string]>> = [];
      if (licenseFile)  uploads.push(uploadDriverDoc(driverId, "license",  licenseFile ).then((u) => ["license",  u]));
      if (nbiFile)      uploads.push(uploadDriverDoc(driverId, "nbi",      nbiFile     ).then((u) => ["nbi",      u]));
      if (barangayFile) uploads.push(uploadDriverDoc(driverId, "barangay", barangayFile).then((u) => ["barangay", u]));
      if (medicalFile)  uploads.push(uploadDriverDoc(driverId, "medical",  medicalFile ).then((u) => ["medical",  u]));

      const results = await Promise.all(uploads);
      const urls: Record<string, string> = {};
      for (const [kind, url] of results) {
        if (kind === "license")  urls.license_url             = url;
        if (kind === "nbi")      urls.nbi_clearance_url       = url;
        if (kind === "barangay") urls.barangay_clearance_url  = url;
        if (kind === "medical")  urls.medical_certificate_url = url;
      }

      if (Object.keys(urls).length > 0) {
        const { error: updateError } = await supabase.from("drivers").update(urls).eq("id", driverId);
        if (updateError) throw new Error(`Could not save document URLs: ${updateError.message}`);
      }

      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[#1a1a2e] px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 bg-[#F47920]/20 rounded-full flex items-center justify-center mb-6 border-2 border-[#F47920]/40">
            <Clock className="w-12 h-12 text-[#F47920]" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">Application Submitted!</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            Ang iyong application bilang driver ay natanggap na.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Ikaw ay <span className="text-[#F47920] font-semibold">ireview ng Admin</span> bago makapag-login. Maaaring tumagal ng 1–2 araw.
          </p>
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#F47920]" />
              <span className="text-white text-sm font-semibold">What happens next?</span>
            </div>
            <p className="text-gray-400 text-xs pl-6">1. Admin reviews your details and documents</p>
            <p className="text-gray-400 text-xs pl-6">2. You will be notified once approved</p>
            <p className="text-gray-400 text-xs pl-6">3. Log in and start accepting rides!</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/driver/login")}
            className="w-full bg-[#F47920] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20"
          >
            Go to Login
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#2d2d4e] pt-12 pb-8 px-5 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-12 left-4 w-9 h-9 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center mt-6">
          <div className="w-16 h-16 bg-[#F47920]/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🛺</span>
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">Maging Driver</h1>
          <p className="text-gray-400 text-sm">Register as a SITA tricycle driver</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-5 pb-24">
        <form onSubmit={handleSubmit} className="py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          {/* Personal Info Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-gray-800 font-bold text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#F47920]" />
              Personal na Impormasyon
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Pangalan <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rolando"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Apelyido <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dela Cruz"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Mobile Number <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+63 912 345 6789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-sm font-semibold mb-2 block">
                  Email <span className="text-[#F47920]">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="driver@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Password <span className="text-[#F47920]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-gray-800 font-bold text-sm mb-4 flex items-center gap-2">
              <span className="text-lg">🛺</span>
              Tricycle Details
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Plate Number <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ABC-1234"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Vehicle Model <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Honda TMX"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Kulay ng Sasakyan <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Puti"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Documents Upload */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-gray-800 font-bold text-sm mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F47920]" />
              Required Documents
            </h2>
            <p className="text-xs text-gray-500 mb-4">I-upload ang lahat ng kailangang dokumento</p>

            <div className="space-y-4">
              {/* Driver's License */}
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-2 block">
                  Driver's License <span className="text-[#F47920]">*</span>
                </label>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'license')}
                    className="hidden"
                    required
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#F47920] transition-colors">
                    {licenseFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <p className="text-xs font-semibold text-gray-800">{licenseFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {((licenseFile.size / 1024) ?? 0).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setLicenseFile(null);
                          }}
                          className="text-xs text-[#F47920] font-semibold"
                        >
                          Palitan
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-[#F47920]/10 rounded-full flex items-center justify-center">
                          <Upload className="w-5 h-5 text-[#F47920]" />
                        </div>
                        <p className="text-xs font-semibold text-gray-800">
                          Click to upload license
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, or PDF</p>
                      </div>
                    )}
                  </div>
                </label>
                {fileErrors.license && <p className="text-xs text-red-600 mt-2">{fileErrors.license}</p>}
              </div>

              {/* NBI Clearance */}
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-2 block">
                  NBI Clearance <span className="text-[#F47920]">*</span>
                </label>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'nbi')}
                    className="hidden"
                    required
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#F47920] transition-colors">
                    {nbiFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <p className="text-xs font-semibold text-gray-800">{nbiFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {((nbiFile.size / 1024) ?? 0).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setNbiFile(null);
                          }}
                          className="text-xs text-[#F47920] font-semibold"
                        >
                          Palitan
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-[#F47920]/10 rounded-full flex items-center justify-center">
                          <Upload className="w-5 h-5 text-[#F47920]" />
                        </div>
                        <p className="text-xs font-semibold text-gray-800">
                          Click to upload NBI clearance
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, or PDF</p>
                      </div>
                    )}
                  </div>
                </label>
                {fileErrors.nbi && <p className="text-xs text-red-600 mt-2">{fileErrors.nbi}</p>}
              </div>

              {/* Barangay Clearance */}
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-2 block">
                  Barangay Clearance <span className="text-[#F47920]">*</span>
                </label>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'barangay')}
                    className="hidden"
                    required
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#F47920] transition-colors">
                    {barangayFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <p className="text-xs font-semibold text-gray-800">{barangayFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {((barangayFile.size / 1024) ?? 0).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setBarangayFile(null);
                          }}
                          className="text-xs text-[#F47920] font-semibold"
                        >
                          Palitan
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-[#F47920]/10 rounded-full flex items-center justify-center">
                          <Upload className="w-5 h-5 text-[#F47920]" />
                        </div>
                        <p className="text-xs font-semibold text-gray-800">
                          Click to upload barangay clearance
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, or PDF</p>
                      </div>
                    )}
                  </div>
                </label>
                {fileErrors.barangay && <p className="text-xs text-red-600 mt-2">{fileErrors.barangay}</p>}
              </div>

              {/* Medical Certificate */}
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-2 block">
                  Medical Certificate <span className="text-[#F47920]">*</span>
                </label>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'medical')}
                    className="hidden"
                    required
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#F47920] transition-colors">
                    {medicalFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <p className="text-xs font-semibold text-gray-800">{medicalFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {((medicalFile.size / 1024) ?? 0).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setMedicalFile(null);
                          }}
                          className="text-xs text-[#F47920] font-semibold"
                        >
                          Palitan
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-[#F47920]/10 rounded-full flex items-center justify-center">
                          <Upload className="w-5 h-5 text-[#F47920]" />
                        </div>
                        <p className="text-xs font-semibold text-gray-800">
                          Click to upload medical certificate
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, or PDF</p>
                      </div>
                    )}
                  </div>
                </label>
                {fileErrors.medical && <p className="text-xs text-red-600 mt-2">{fileErrors.medical}</p>}
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              required
              id="driver-terms"
              className="mt-1 w-4 h-4 text-[#F47920] border-gray-300 rounded focus:ring-[#F47920]"
            />
            <label htmlFor="driver-terms" className="text-xs text-gray-600 leading-relaxed">
              Sumasang-ayon ako sa{" "}
              <span className="text-[#F47920] font-semibold">Driver Terms</span>,{" "}
              <span className="text-[#F47920] font-semibold">Terms of Service</span> at{" "}
              <span className="text-[#F47920] font-semibold">Privacy Policy</span> ng SITA
            </label>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47920] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 mt-6 disabled:opacity-60"
          >
            {loading ? "Nagsusumite..." : "Mag-Submit ng Application"}
          </motion.button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-4">
            May account na?{" "}
            <button
              type="button"
              onClick={() => navigate("/driver/login")}
              className="text-[#F47920] font-semibold"
            >
              Mag-Log In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}