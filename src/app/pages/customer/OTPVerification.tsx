import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail, Check, RefreshCw } from "lucide-react";
import { sendEmailOTP, verifyEmailOTP } from "../../services/api";

export function CustomerOTPVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get the email stored during signup
  const email = localStorage.getItem("sita_otp_email") || "";
  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, "$1***$2")
    : "your email";

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setError("");
    try {
      await sendEmailOTP(email);
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;
    if (!email) { navigate("/customer/home"); return; }

    setIsVerifying(true);
    setError("");

    try {
      const isValid = await verifyEmailOTP(email, otpCode);
      if (isValid) {
        localStorage.removeItem("sita_otp_email");
        setIsVerified(true);
        setTimeout(() => navigate("/customer/home"), 1500);
      } else {
        setError("Invalid or expired OTP. Please try again.");
        setIsVerifying(false);
      }
    } catch {
      setError("Verification failed. Please try again.");
      setIsVerifying(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F47920] to-[#F47920]/90 pt-12 pb-8 px-5 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center mt-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">I-verify ang Email</h1>
          <p className="text-white/80 text-sm">
            Nag-send kami ng 6-digit code sa
          </p>
          <p className="text-white font-semibold text-sm mt-1">{maskedEmail}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-8">
        {isVerified ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-gray-600 text-sm">Redirecting ka na...</p>
          </motion.div>
        ) : (
          <>
            <p className="text-gray-500 text-sm text-center mb-6">
              Check your inbox and enter the code below.{"\n"}Don't forget to check your spam folder.
            </p>

            {/* OTP Input */}
            <div className="flex gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 text-gray-800 transition-colors ${
                    digit ? "border-[#F47920] bg-orange-50" : "border-gray-300"
                  }`}
                />
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center mb-4"
              >
                {error}
              </motion.p>
            )}

            {/* Timer & Resend */}
            <div className="text-center mb-8">
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="flex items-center gap-1.5 text-[#F47920] font-semibold text-sm mx-auto disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`} />
                  {isResending ? "Sending..." : "I-resend ang code"}
                </button>
              ) : (
                <p className="text-gray-500 text-sm">
                  Resend code in{" "}
                  <span className="font-semibold text-[#F47920]">{timer}s</span>
                </p>
              )}
            </div>

            {/* Verify Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleVerify}
              disabled={otp.join("").length !== 6 || isVerifying}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-colors ${
                otp.join("").length === 6 && !isVerifying
                  ? "bg-[#F47920] shadow-orange-900/20"
                  : "bg-gray-300"
              }`}
            >
              {isVerifying ? "Verifying..." : "I-verify ang Email"}
            </motion.button>

            <button
              onClick={() => navigate("/customer/home")}
              className="text-gray-400 text-sm mt-5"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
