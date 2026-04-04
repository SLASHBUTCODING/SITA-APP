// SMS OTP Service for SITA App
// This simulates sending OTP via SMS (in production, integrate with actual SMS provider)

export interface OTPData {
  phone: string;
  otp: string;
  expiresAt: Date;
}

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map<string, OTPData>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(phone: string, purpose: 'signup' | 'login' = 'signup'): Promise<boolean> {
  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Store OTP
    otpStore.set(phone, { phone, otp, expiresAt });
    
    // Simulate SMS sending (in production, use actual SMS provider like Twilio, Vonage, etc.)
    console.log(`📱 SMS sent to ${phone}: Your SITA OTP is ${otp}`);
    console.log(`📱 This would be sent via SMS provider in production`);
    
    // For development, also log to console
    if (typeof window !== 'undefined') {
      console.log(`🔢 Development OTP for ${phone}: ${otp}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const storedOTP = otpStore.get(phone);
    
    if (!storedOTP) {
      return false;
    }
    
    // Check if OTP is expired
    if (new Date() > storedOTP.expiresAt) {
      otpStore.delete(phone);
      return false;
    }
    
    // Check if OTP matches
    if (storedOTP.otp === otp) {
      otpStore.delete(phone); // Remove OTP after successful verification
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

export async function resendOTP(phone: string): Promise<boolean> {
  return sendOTP(phone, 'signup');
}

// For development/testing - get current OTP (remove in production)
export function getCurrentOTP(phone: string): string | null {
  const stored = otpStore.get(phone);
  if (stored && new Date() <= stored.expiresAt) {
    return stored.otp;
  }
  return null;
}
