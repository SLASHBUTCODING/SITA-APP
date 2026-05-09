import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Star, Shield, Bell, HelpCircle, LogOut, FileText, Award } from "lucide-react";
import { DriverNav } from "../../components/DriverNav";
import { getStoredUser, clearAuth, type DriverData } from "../../services/api";
import { avatarUrl } from "../../lib/avatar";
import { supabase } from "../../../lib/supabase";

const BADGE_META: Record<string, { emoji: string; label: string; sub: string }> = {
  top_driver: { emoji: "🔥", label: "Top Driver", sub: "Nangungunang Driver" },
  five_star:  { emoji: "🌟", label: "5-Star",     sub: "100+ limang bituin" },
  on_time:    { emoji: "⏱",  label: "On Time",    sub: "95% sa oras" },
};

const MENU_SECTIONS = [
  {
    title: "Sasakyan & Dokumento",
    items: [
      { icon: FileText, label: "Mga Dokumento Ko", desc: "LTO, franchise, insurance" },
      { icon: Shield,   label: "Kaligtasan at Compliance", desc: "Mga regulasyon ng tricycle" },
      { icon: Award,    label: "Mga Achievement Ko", desc: "Mga naabot at badge" },
    ],
  },
  {
    title: "Settings",
    items: [
      { icon: Bell,        label: "Mga Notipikasyon", desc: "I-manage ang alerts" },
      { icon: HelpCircle,  label: "Help Center",      desc: "FAQs at suporta" },
      { icon: Star,        label: "I-rate ang App",   desc: "Ibahagi ang feedback" },
    ],
  },
];

export function DriverProfile() {
  const navigate = useNavigate();
  const driver = getStoredUser<DriverData>();
  const driverId = driver?.id;
  const [badgeKeys, setBadgeKeys] = useState<string[]>([]);
  const [liveStats, setLiveStats] = useState<{ total_rides: number; average_rating: number; total_earnings: number } | null>(null);

  useEffect(() => {
    if (!driverId) return;
    let cancelled = false;
    (async () => {
      const [{ data: ach }, { data: drv }, { data: rides }] = await Promise.all([
        supabase.from("driver_achievements").select("badge_key").eq("driver_id", driverId),
        supabase.from("drivers").select("total_rides, average_rating, total_earnings").eq("id", driverId).single(),
        supabase.from("rides").select("fare_amount").eq("driver_id", driverId).eq("status", "completed"),
      ]);
      if (cancelled) return;
      setBadgeKeys(((ach ?? []) as { badge_key: string }[]).map((r) => r.badge_key));

      const completedTotal = (rides ?? []).reduce((sum, r: { fare_amount: number | null }) => sum + (r.fare_amount || 0), 0);
      const completedCount = rides?.length ?? 0;
      setLiveStats({
        total_rides: completedCount,
        average_rating: drv?.average_rating ?? 5.0,
        total_earnings: completedTotal,
      });
    })();
    return () => { cancelled = true; };
  }, [driverId]);

  const stats = [
    { emoji: "🛺", label: "Total Trips",   value: (liveStats?.total_rides ?? 0).toLocaleString() },
    { emoji: "⭐", label: "Driver Rating", value: liveStats?.average_rating ? liveStats.average_rating.toFixed(1) : "--" },
    { emoji: "💰", label: "Total Kita",    value: `₱${Math.floor(liveStats?.total_earnings ?? 0).toLocaleString()}` },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  const driverName = driver ? `${driver.first_name} ${driver.last_name}` : "Driver";

  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#2d2d4e] pt-12 pb-6 px-5">
        <h1 className="text-white font-bold text-lg mb-4">Profile ko</h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="relative">
            <img src={avatarUrl(driverName, driver?.profile_photo_url)} alt="Driver" className="w-16 h-16 rounded-full object-cover border-2 border-[#F47920]" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F47920] rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[8px] text-white font-bold">✓</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-base">{driverName}</h2>
            <p className="text-gray-400 text-xs">{driver?.phone || "---"}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-xs font-semibold">{(liveStats?.average_rating ?? driver?.average_rating ?? 0).toFixed(1) || "--"}</span>
              <span className="text-gray-400 text-xs">· {driver?.verification_status === "approved" ? "Verified Driver" : "Pending Verification"}</span>
            </div>
          </div>
          <button className="bg-[#F47920] text-white text-xs font-semibold px-3 py-1.5 rounded-full">Edit</button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto pb-24">
        <div className="px-5">
          {/* Stats */}
          <div className="-mt-3 mb-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-around">
              {stats.map(({ emoji, label, value }) => (
                <div key={label} className="text-center">
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-lg">{emoji}</span>
                  </div>
                  <p className="text-gray-800 font-black text-sm">{value}</p>
                  <p className="text-gray-400 text-[10px]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tricycle Info */}
          <div className="mb-4">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Impormasyon ng Sasakyan</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F47920]/10 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🛺</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-bold text-sm">Tricycle · {driver?.plate_number || "---"}</p>
                  <p className="text-gray-400 text-xs">{driver?.vehicle_model || "---"} · {driver?.vehicle_color || "---"}</p>
                </div>
                <div className="bg-green-50 px-2.5 py-1 rounded-full">
                  <p className="text-green-600 text-[10px] font-semibold">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-4">
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Aking mga Badge</p>
              {badgeKeys.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Wala ka pang naabot na badge.</p>
              ) : (
                <div className="flex gap-3">
                  {badgeKeys.map((key) => {
                    const meta = BADGE_META[key] ?? { emoji: "🏅", label: key, sub: "" };
                    return (
                      <div key={key} className="flex-1 bg-[#F47920]/5 border border-[#F47920]/20 rounded-xl p-2.5 text-center">
                        <span className="text-xl">{meta.emoji}</span>
                        <p className="text-gray-700 text-[10px] font-bold mt-1">{meta.label}</p>
                        <p className="text-gray-400 text-[9px]">{meta.sub}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          {MENU_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 px-1">{section.title}</p>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {section.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      whileTap={{ backgroundColor: "#f9fafb" }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 ${i < section.items.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      <div className="w-9 h-9 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[#F47920]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm font-semibold text-red-500">Mag-Log Out</span>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mb-2">SITA v1.0.0 · 2026</p>
        </div>
      </div>

      <DriverNav />
    </div>
  );
}
