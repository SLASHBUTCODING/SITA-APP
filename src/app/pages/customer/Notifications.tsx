import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Bell, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getStoredUser, getStoredRole, type UserData } from "../../services/api";
import { supabase } from "../../../lib/supabase";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

const TYPE_ICON: Record<string, { emoji: string; color: string }> = {
  ride: { emoji: "🛺", color: "bg-green-50" },
  promo: { emoji: "🎉", color: "bg-purple-50" },
  payment: { emoji: "💳", color: "bg-blue-50" },
  rating: { emoji: "⭐", color: "bg-yellow-50" },
  system: { emoji: "ℹ", color: "bg-gray-50" },
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "Now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const d = Math.round(hr / 24);
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

export function CustomerNotifications() {
  const navigate = useNavigate();
  const user = getStoredUser<UserData>();
  const userId = user?.id;
  const role = getStoredRole();
  const userRole = role === "driver" ? "driver" : "customer";
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,title,body,read_at,created_at")
        .eq("user_id", userId)
        .eq("user_role", userRole)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      setNotifications((data ?? []) as Notif[]);
      setLoading(false);
    })();

    const channel = (supabase
      .channel(`notif_${userId}`) as any)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: { new: Notif & { user_id: string } }) => {
          const row = payload.new;
          if (row.user_id !== userId) return;
          setNotifications((cur) => [row, ...cur]);
        }
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    setNotifications(notifications.map((n) => n.read_at ? n : { ...n, read_at: now }));
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
  };

  const markAsRead = async (id: string) => {
    const now = new Date().toISOString();
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
    await supabase.from("notifications").update({ read_at: now }).eq("id", id);
  };

  const deleteNotification = async (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-gradient-to-b from-[#F47920] to-[#F47920]/90 pt-12 pb-6 px-5 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center justify-between mt-6">
          <div>
            <h1 className="text-white font-bold text-2xl">Notifications</h1>
            <p className="text-white/80 text-sm">
              {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="px-5 py-3 bg-white border-b border-gray-100">
          <button
            onClick={markAllRead}
            className="text-[#F47920] text-sm font-semibold flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto px-5 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">Naglo-load...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold">No notifications</p>
            <p className="text-gray-400 text-sm">We'll notify you when something new arrives</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const meta = TYPE_ICON[notif.type] ?? TYPE_ICON.system;
            const isRead = !!notif.read_at;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`relative bg-white rounded-2xl p-4 shadow-sm ${!isRead ? "ring-2 ring-[#F47920]/20" : ""}`}
              >
                {!isRead && <div className="absolute top-4 right-4 w-2 h-2 bg-[#F47920] rounded-full" />}
                <div className="flex gap-3">
                  <div className={`w-12 h-12 ${meta.color} rounded-full flex items-center justify-center flex-shrink-0 text-2xl`}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">{notif.title}</h3>
                    {notif.body && <p className="text-xs text-gray-600 leading-relaxed mb-2">{notif.body}</p>}
                    <p className="text-[10px] text-gray-400">{relativeTime(notif.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="flex-1 py-2 rounded-lg bg-[#F47920]/10 text-[#F47920] text-xs font-semibold"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
