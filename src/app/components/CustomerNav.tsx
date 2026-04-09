import { useNavigate, useLocation } from "react-router";
import { Home, Clock, MessageCircle, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/customer/home" },
  { icon: Clock, label: "History", path: "/customer/history" },
  { icon: MessageCircle, label: "Messages", path: "/customer/messages" },
  { icon: User, label: "Profile", path: "/customer/profile" },
];

export function CustomerNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-white border-t border-gray-100 flex items-center justify-around px-2 pb-safe pt-2 z-50 flex-shrink-0">
      {navItems.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${active ? "bg-[#F47920]/10" : ""}`}>
              <Icon className={`w-5 h-5 ${active ? "text-[#F47920]" : "text-gray-400"}`} />
            </div>
            <span className={`text-[10px] font-medium ${active ? "text-[#F47920]" : "text-gray-400"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
