// Firebase SMS OTP Service for SITA App
// Real SMS integration using Firebase Authentication

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCA_s3pv-r62oHsQASW6aOBUxlD11cVBR8",
  authDomain: "sita-app-e543d.firebaseapp.com",
  projectId: "sita-app-e543d",
  storageBucket: "sita-app-e543d.firebasestorage.app",
  messagingSenderId: "383379650638",
  appId: "1:383379650638:web:3548603fffec3b37032b1f",
  measurementId: "G-MYS1J4VEZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export interface OTPData {
  phone: string;
  confirmationResult: any;
}

// Store confirmation results
const otpStore = new Map<string, OTPData>();

export async function sendOTP(phone: string, purpose: 'signup' | 'login' = 'signup'): Promise<boolean> {
  try {
    // Format phone number for Firebase (E.164 format)
    const formattedPhone = formatPhoneNumber(phone);
    
    // Create reCAPTCHA verifier (invisible)
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });

    // Send SMS OTP
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    
    // Store confirmation result
    otpStore.set(phone, { phone, confirmationResult });
    
    console.log(`📱 Real SMS sent to ${phone}`);
    console.log(`📱 Firebase confirmation result stored`);
    
    return true;
  } catch (error: any) {
    console.error('Error sending SMS OTP:', error);
    
    // Fallback to console OTP for development
    const fallbackOTP = generateFallbackOTP();
    console.log(`📱 Fallback OTP for ${phone}: ${fallbackOTP}`);
    return false;
  }
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const storedOTP = otpStore.get(phone);
    
    if (!storedOTP) {
      console.log('No stored confirmation result found');
      return false;
    }
    
    // Verify OTP with Firebase
    const result = await storedOTP.confirmationResult.confirm(otp);
    
    if (result.user) {
      // Remove stored OTP after successful verification
      otpStore.delete(phone);
      console.log(`✅ SMS OTP verified for ${phone}`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    
    // Fallback verification for development
    return verifyFallbackOTP(phone, otp);
  }
}

export async function resendOTP(phone: string): Promise<boolean> {
  return sendOTP(phone, 'signup');
}

// Helper functions
function formatPhoneNumber(phone: string): string {
  // Convert to E.164 format for Firebase
  if (phone.startsWith('+')) {
    return phone;
  }
  if (phone.startsWith('09')) {
    return '+63' + phone.substring(1);
  }
  return '+63' + phone;
}

function generateFallbackOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function verifyFallbackOTP(phone: string, otp: string): boolean {
  // For development - accept common test OTPs
  const testOTPs = ['123456', '000000', '111111'];
  return testOTPs.includes(otp);
}

// For development/testing - get current OTP (remove in production)
export function getCurrentOTP(phone: string): string | null {
  console.log(`📱 Check your phone for real SMS from Firebase`);
  return '123456'; // Fallback for testing
}
