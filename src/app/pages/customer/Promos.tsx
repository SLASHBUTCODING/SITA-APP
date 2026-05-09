import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Gift, Tag, Check, X, Sparkles } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Promo = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  valid_until: string | null;
};

const CARD_COLORS = [
  "bg-gradient-to-br from-purple-500 to-purple-600",
  "bg-gradient-to-br from-green-500 to-green-600",
  "bg-gradient-to-br from-blue-500 to-blue-600",
  "bg-gradient-to-br from-pink-500 to-pink-600",
];

export function CustomerPromos() {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("promotions")
        .select("id,code,title,description,discount_type,discount_value,valid_until")
        .eq("active", true)
        .or(`valid_until.is.null,valid_until.gte.${today}`)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setPromos((data ?? []) as Promo[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const formatDiscount = (p: Promo) =>
    p.discount_type === "percent" ? `${p.discount_value}%` : `₱${p.discount_value}`;

  const formatExpiry = (iso: string | null) =>
    iso ? `Valid until ${new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}` : "No expiry";

  const handleApplyCode = () => {
    const promo = promos.find((p) => p.code.toUpperCase() === promoCode.toUpperCase());
    if (promo) {
      setAppliedPromo(promo.code);
      setError("");
      setTimeout(() => navigate(-1), 1500);
    } else {
      setError("Invalid promo code");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleQuickApply = (code: string) => {
    setPromoCode(code);
    setAppliedPromo(code);
    setTimeout(() => navigate(-1), 1500);
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
            <h1 className="text-white font-bold text-2xl mb-1">Promo Codes</h1>
            <p className="text-white/80 text-sm">Save more sa bawat ride!</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-24">
        <div className="bg-white rounded-2xl shadow-sm p-4 -mt-4 mb-6">
          <p className="text-xs text-gray-500 font-semibold uppercase mb-3 flex items-center gap-2">
            <Tag className="w-3 h-3" />
            Enter Promo Code
          </p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="SITA20"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setError(""); }}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800 uppercase font-semibold"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyCode}
              disabled={!promoCode}
              className={`px-6 py-3 rounded-xl font-bold text-white ${promoCode ? "bg-[#F47920]" : "bg-gray-300"}`}
            >
              Apply
            </motion.button>
          </div>
          {error && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-semibold flex items-center gap-1 mt-2">
              <X className="w-3 h-3" />
              {error}
            </motion.p>
          )}
          {appliedPromo && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-semibold">Promo code applied successfully!</p>
            </motion.div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 mb-3 px-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F47920]" />
            Available Promos
          </h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-6">Naglo-load...</p>
            ) : promos.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Walang available na promo ngayon.</p>
            ) : promos.map((promo, idx) => (
              <motion.div key={promo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className={`${CARD_COLORS[idx % CARD_COLORS.length]} p-4 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4" />
                          <span className="text-xs font-semibold opacity-90">PROMO CODE</span>
                        </div>
                        <h3 className="text-xl font-black mb-1">{promo.title}</h3>
                        {promo.description && <p className="text-sm opacity-90">{promo.description}</p>}
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <p className="text-sm font-black">{formatDiscount(promo)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <p className="text-xs font-bold">{promo.code}</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleQuickApply(promo.code)} className="bg-white text-gray-800 px-4 py-1.5 rounded-lg text-xs font-bold">
                        Use Code
                      </motion.button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedPromo(expandedPromo === promo.id ? null : promo.id)}
                  className="w-full px-4 py-3 bg-gray-50 text-xs text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                >
                  {expandedPromo === promo.id ? "Hide" : "View"} Terms & Conditions
                </button>
                {expandedPromo === promo.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-2"><span className="font-semibold">Expiry:</span> {formatExpiry(promo.valid_until)}</p>
                    {promo.description && <p className="text-xs text-gray-600"><span className="font-semibold">Details:</span> {promo.description}</p>}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Paano Gamitin
          </h3>
          <ol className="space-y-2 text-xs text-blue-800">
            <li className="flex gap-2"><span className="font-bold">1.</span><span>I-copy ang promo code o i-click ang "Use Code"</span></li>
            <li className="flex gap-2"><span className="font-bold">2.</span><span>I-paste sa booking checkout page</span></li>
            <li className="flex gap-2"><span className="font-bold">3.</span><span>Makikita mo agad ang discount sa fare</span></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
