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

// Add reCAPTCHA to Window interface
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export interface OTPData {
  phone: string;
  otp?: string;
  confirmationResult?: any;
  expiresAt: Date;
}

// Store OTPs in memory
const otpStore = new Map<string, OTPData>();

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

export async function sendOTP(phone: string, purpose: 'signup' | 'login' = 'signup'): Promise<boolean> {
  try {
    // Format phone number for Firebase (E.164 format)
    const formattedPhone = formatPhoneNumber(phone);
    
    // Create reCAPTCHA verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
      'size': 'invisible',
      'callback': (response: any) => {
        console.log('reCAPTCHA solved');
      }
    });

    // Send SMS OTP via Firebase
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
    
    // Store confirmation result
    otpStore.set(phone, { phone, confirmationResult, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    
    console.log(`📱 Real Firebase SMS sent to ${phone}`);
    console.log(`📱 Check your phone for the OTP!`);
    
    return true;
  } catch (error: any) {
    console.error('Firebase SMS error:', error);
    
    // Fallback to console OTP
    const otp = generateFallbackOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpStore.set(phone, { phone, otp, expiresAt });
    
    console.log(`📱 Firebase failed, using fallback OTP: ${otp}`);
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
      console.log(`✅ OTP verified for ${phone}`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

export async function resendOTP(phone: string): Promise<boolean> {
  return sendOTP(phone, 'signup');
}

// Helper functions
function generateFallbackOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// For development/testing - get current OTP
export function getCurrentOTP(phone: string): string | null {
  const stored = otpStore.get(phone);
  if (stored && new Date() <= stored.expiresAt) {
    return stored.otp;
  }
  return null;
}
