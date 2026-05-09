import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Star, Shield, CreditCard, Bell, HelpCircle, LogOut, MapPin, Award } from "lucide-react";
import { CustomerNav } from "../../components/CustomerNav";
import { getStoredUser, clearAuth, type UserData } from "../../services/api";
import { avatarUrl } from "../../lib/avatar";

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: Shield, label: "Kaligtasan & Insurance", desc: "Tingnan ang inyong coverage" },
      { icon: CreditCard, label: "Paraan ng Bayad", desc: "Cash, GCash, Card" },
      { icon: Bell, label: "Mga Notipikasyon", desc: "I-manage ang mga alerto" },
    ],
  },
  {
    title: "Tulong",
    items: [
      { icon: HelpCircle, label: "Help Center", desc: "FAQs at suporta" },
      { icon: Star, label: "I-rate ang App", desc: "Ibahagi ang inyong feedback" },
    ],
  },
];

export function CustomerProfile() {
  const navigate = useNavigate();
  const user = getStoredUser<UserData>();

  const STATS = [
    { icon: "ï¿½", label: "Total Trips", value: String(user?.total_rides ?? 0) },
    { icon: "â­", label: "Avg Rating", value: user?.average_rating ? (user.average_rating ?? 0).toFixed(1) : "--" },
    { icon: "ðŸ’°", label: "Wallet", value: user?.wallet_balance ? `â‚±${(user.wallet_balance ?? 0).toFixed(0)}` : "â‚±0" },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#2d2d4e] pt-12 pb-6 px-5">
        <h1 className="text-white font-bold text-lg mb-4">Aking Profile</h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="relative">
            <img src={avatarUrl(user ? `${user.first_name} ${user.last_name}` : "Pasahero", user?.profile_photo_url)} alt="User" className="w-16 h-16 rounded-full object-cover border-2 border-[#F47920]" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F47920] rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-[8px] text-white font-bold">âœ“</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-base">{user ? `${user.first_name} ${user.last_name}` : "Pasahero"}</h2>
            <p className="text-gray-400 text-xs">{user?.phone || "---"}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-xs font-semibold">{(user?.average_rating ?? 0).toFixed(1) || "--"}</span>
              <span className="text-gray-400 text-xs">Â· Verified Passenger</span>
            </div>
          </div>
          <button className="bg-[#F47920] text-white text-xs font-semibold px-3 py-1.5 rounded-full">Edit</button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 -mt-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex justify-around">
          {STATS.map(({ icon, label, value }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-lg">{icon}</span>
              </div>
              <p className="text-gray-800 font-black text-base">{value}</p>
              <p className="text-gray-400 text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Banner */}
      <div className="px-5 mb-4">
        <div className="bg-gradient-to-r from-[#F47920] to-[#e06810] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl">ðŸŽ</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Mag-Refer, Mag-Earn!</p>
            <p className="text-orange-100 text-xs">Kumita ng â‚±20 sa bawat kaibigan na mag-sign up</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-auto px-5 pb-24">
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

        <p className="text-center text-xs text-gray-300 mb-2">SITA v1.0.0 Â· Â© 2026</p>
      </div>

      <CustomerNav />
    </div>
  );
}