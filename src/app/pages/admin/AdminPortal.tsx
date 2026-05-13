import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Shield, Clock, Star, Eye, EyeOff, CheckCircle, XCircle, RotateCcw, Car, FileText, DollarSign, Save, LogOut, RefreshCw, Users } from "lucide-react";
import { supabase } from "../../../lib/supabase";

const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || "sita-admin-2024";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  plate_number: string;
  vehicle_model: string;
  vehicle_color: string;
  license_url?: string;
  nbi_clearance_url?: string;
  barangay_clearance_url?: string;
  medical_certificate_url?: string;
  verification_status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface PricingConfig {
  id?: string;
  base_fare: number;
  per_km_rate: number;
  minimum_fare: number;
  waiting_time_rate: number;
  updated_at?: string;
}

export function AdminPortal() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [pricing, setPricing] = useState<PricingConfig>({
    base_fare: 40,
    per_km_rate: 15,
    minimum_fare: 40,
    waiting_time_rate: 2
  });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"drivers" | "pricing">("drivers");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError("");
    } else {
      setPwError("Invalid admin password.");
    }
  };

  const fetchDrivers = async () => {
    setLoading(true);
    const query = supabase
      .from("drivers")
      .select("id, first_name, last_name, phone, email, plate_number, vehicle_model, vehicle_color, license_url, nbi_clearance_url, barangay_clearance_url, medical_certificate_url, verification_status, created_at")
      .order("created_at", { ascending: false });

    if (filter !== "all") query.eq("verification_status", filter);

    const { data, error } = await query;
    if (!error && data) setDrivers(data as Driver[]);
    setLoading(false);
  };

  const fetchPricing = async () => {
    setPricingLoading(true);
    const { data, error } = await supabase
      .from("pricing_config")
      .select("*")
      .single();
    
    if (!error && data) {
      setPricing(data as PricingConfig);
    }
    setPricingLoading(false);
  };

  const savePricing = async () => {
    setPricingLoading(true);
    const { error } = await supabase
      .from("pricing_config")
      .upsert({
        id: pricing.id || 1,
        base_fare: pricing.base_fare,
        per_km_rate: pricing.per_km_rate,
        minimum_fare: pricing.minimum_fare,
        waiting_time_rate: pricing.waiting_time_rate
      });
    
    if (!error) {
      alert("Pricing updated successfully!");
      fetchPricing();
    } else {
      alert("Error updating pricing: " + error.message);
    }
    setPricingLoading(false);
  };

  useEffect(() => {
    if (authed) {
      fetchDrivers();
      fetchPricing();
    }
  }, [authed, filter]);

  const updateStatus = async (driverId: string, status: "approved" | "rejected") => {
    setActionLoading(driverId);
    const { error } = await supabase
      .from("drivers")
      .update({ verification_status: status })
      .eq("id", driverId);

    if (!error) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, verification_status: status } : d))
      );
      if (selected?.id === driverId) setSelected({ ...selected, verification_status: status });
    }
    setActionLoading(null);
  };

  const counts = {
    pending: drivers.filter((d) => d.verification_status === "pending").length,
    approved: drivers.filter((d) => d.verification_status === "approved").length,
    rejected: drivers.filter((d) => d.verification_status === "rejected").length,
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-[#1a1a2e] rounded-2xl p-8 border border-white/10 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#F47920]/20 rounded-2xl flex items-center justify-center mb-4 border border-[#F47920]/30">
              <Shield className="w-8 h-8 text-[#F47920]" />
            </div>
            <h1 className="text-white text-2xl font-bold">SITA Admin</h1>
            <p className="text-gray-400 text-sm mt-1">Driver Verification Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white/80 text-sm font-semibold mb-2 block">Admin Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pr-11 pl-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#F47920]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {pwError && <p className="text-red-400 text-xs mt-1">{pwError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-[#F47920] text-white font-bold py-3 rounded-xl shadow-lg"
            >
              Enter Admin Portal
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <div className="bg-[#1a1a2e] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#F47920]/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#F47920]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">SITA Admin</h1>
            <p className="text-gray-500 text-xs">Driver Verification</p>
          </div>
        </div>
        <button
          onClick={() => setAuthed(false)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pending", count: counts.pending, color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock },
            { label: "Verified", count: counts.approved, color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle },
            { label: "Rejected", count: counts.rejected, color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
          ].map(({ label, count, color, bg, icon: Icon }) => (
            <div key={label} className={`${bg} border border-white/10 rounded-xl p-4 text-center`}>
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className={`text-xl font-bold ${color}`}>{count}</p>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "drivers"
                ? "bg-[#F47920] text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" /> Drivers
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "pricing"
                ? "bg-[#F47920] text-white"
                : "bg-white/10 text-gray-400 hover:bg-white/20"
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1" /> Pricing
          </button>
        </div>

        {/* Pricing Configuration Section */}
        {activeTab === "pricing" && (
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#F47920]" />
              Pricing Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-semibold mb-2 block">Base Fare (₱)</label>
                <input
                  type="number"
                  value={pricing.base_fare}
                  onChange={(e) => setPricing({...pricing, base_fare: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#F47920]"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm font-semibold mb-2 block">Rate per Kilometer (₱)</label>
                <input
                  type="number"
                  value={pricing.per_km_rate}
                  onChange={(e) => setPricing({...pricing, per_km_rate: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#F47920]"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm font-semibold mb-2 block">Minimum Fare (₱)</label>
                <input
                  type="number"
                  value={pricing.minimum_fare}
                  onChange={(e) => setPricing({...pricing, minimum_fare: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#F47920]"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm font-semibold mb-2 block">Waiting Time Rate (₱/minute)</label>
                <input
                  type="number"
                  value={pricing.waiting_time_rate}
                  onChange={(e) => setPricing({...pricing, waiting_time_rate: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#F47920]"
                />
              </div>
              
              <button
                onClick={savePricing}
                disabled={pricingLoading}
                className="w-full bg-[#F47920] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {pricingLoading ? "Saving..." : "Save Pricing"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "drivers" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-colors ${
                    filter === f
                      ? "bg-[#F47920] text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {f}
                </button>
              ))}
              <button
                onClick={fetchDrivers}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-white/10 text-gray-300 hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading drivers...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No {filter === "all" ? "" : filter} drivers found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drivers.map((driver) => (
                  <motion.div
                    key={driver.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-bold truncate">
                            {driver.first_name} {driver.last_name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                            driver.verification_status === "approved"
                              ? "bg-green-400/20 text-green-400"
                              : driver.verification_status === "rejected"
                              ? "bg-red-400/20 text-red-400"
                              : "bg-yellow-400/20 text-yellow-400"
                          }`}>
                            {driver.verification_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                          <Car className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{driver.plate_number} · {driver.vehicle_model} · {driver.vehicle_color}</span>
                        </div>
                        <p className="text-gray-500 text-xs">{driver.phone}</p>
                        {driver.email && <p className="text-gray-500 text-xs">{driver.email}</p>}
                        <p className="text-gray-600 text-xs mt-0.5">
                          Applied: {new Date(driver.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <div className="mt-3 space-y-1">
                          <p className="text-gray-400 text-xs font-semibold mb-1">Documents:</p>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-300 text-xs">Driver's License</span>
                            {!driver.license_url || driver.license_url.includes('placeholder') ? (
                              <span className="text-gray-500 text-xs italic">(Not uploaded)</span>
                            ) : (
                              <button
                                onClick={() => window.open(driver.license_url, '_blank')}
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-purple-400" />
                            <span className="text-gray-300 text-xs">NBI Clearance</span>
                            {!driver.nbi_clearance_url || driver.nbi_clearance_url.includes('placeholder') ? (
                              <span className="text-gray-500 text-xs italic">(Not uploaded)</span>
                            ) : (
                              <button
                                onClick={() => window.open(driver.nbi_clearance_url, '_blank')}
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-green-400" />
                            <span className="text-gray-300 text-xs">Barangay Clearance</span>
                            {!driver.barangay_clearance_url || driver.barangay_clearance_url.includes('placeholder') ? (
                              <span className="text-gray-500 text-xs italic">(Not uploaded)</span>
                            ) : (
                              <button
                                onClick={() => window.open(driver.barangay_clearance_url, '_blank')}
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-red-400" />
                            <span className="text-gray-300 text-xs">Medical Certificate</span>
                            {!driver.medical_certificate_url || driver.medical_certificate_url.includes('placeholder') ? (
                              <span className="text-gray-500 text-xs italic">(Not uploaded)</span>
                            ) : (
                              <button
                                onClick={() => window.open(driver.medical_certificate_url, '_blank')}
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-0.5"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {driver.verification_status !== "approved" && (
                          <button
                            onClick={() => updateStatus(driver.id, "approved")}
                            disabled={actionLoading === driver.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-semibold hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {actionLoading === driver.id ? "..." : "Approve"}
                          </button>
                        )}
                        {driver.verification_status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(driver.id, "rejected")}
                            disabled={actionLoading === driver.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {actionLoading === driver.id ? "..." : "Reject"}
                          </button>
                        )}
                        {driver.verification_status !== "pending" && (
                          <button
                            onClick={() => updateStatus(driver.id, "approved")}
                            disabled={driver.verification_status === "approved" || actionLoading === driver.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-semibold hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
