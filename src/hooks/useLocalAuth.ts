import { useState, useEffect, useCallback } from 'react';

const PIN_HASH_KEY = 'topfocus_pin_hash';
const BIOMETRIC_KEY = 'topfocus_biometric_enabled';
const LOCAL_AUTH_VERIFIED_KEY = 'topfocus_local_auth_verified';
const SESSION_LAST_ACTIVE_KEY = 'topfocus_last_active';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Simple hash for PIN (not crypto-secure, but adequate for local screen lock)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'topfocus_salt_2024');
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useLocalAuth() {
  const [hasPinSet, setHasPinSet] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLocallyVerified, setIsLocallyVerified] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Check state on mount
  useEffect(() => {
    setHasPinSet(!!localStorage.getItem(PIN_HASH_KEY));
    setBiometricEnabled(localStorage.getItem(BIOMETRIC_KEY) === 'true');
    
    // Check WebAuthn availability
    setBiometricAvailable(
      typeof window !== 'undefined' &&
      !!window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    );

    // Check session expiry
    const lastActive = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    if (lastActive) {
      const elapsed = Date.now() - parseInt(lastActive, 10);
      if (elapsed > SESSION_TIMEOUT) {
        setIsSessionExpired(true);
        localStorage.removeItem(LOCAL_AUTH_VERIFIED_KEY);
      }
    }

    // Check if already verified this session
    const verified = sessionStorage.getItem(LOCAL_AUTH_VERIFIED_KEY) === 'true';
    setIsLocallyVerified(verified);
  }, []);

  // Keep last active timestamp fresh
  useEffect(() => {
    const update = () => localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
    update();
    const interval = setInterval(update, 60_000); // every minute
    return () => clearInterval(interval);
  }, []);

  const needsLocalAuth = useCallback(() => {
    const hasPin = !!localStorage.getItem(PIN_HASH_KEY);
    const bioOn = localStorage.getItem(BIOMETRIC_KEY) === 'true';
    if (!hasPin && !bioOn) return false;
    
    const verified = sessionStorage.getItem(LOCAL_AUTH_VERIFIED_KEY) === 'true';
    if (verified) {
      // Check 24h expiry
      const lastActive = localStorage.getItem(SESSION_LAST_ACTIVE_KEY);
      if (lastActive) {
        const elapsed = Date.now() - parseInt(lastActive, 10);
        if (elapsed > SESSION_TIMEOUT) {
          sessionStorage.removeItem(LOCAL_AUTH_VERIFIED_KEY);
          return true;
        }
      }
      return false;
    }
    return true;
  }, []);

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    localStorage.setItem(PIN_HASH_KEY, hash);
    setHasPinSet(true);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = localStorage.getItem(PIN_HASH_KEY);
    if (!stored) return false;
    const hash = await hashPin(pin);
    const ok = hash === stored;
    if (ok) {
      sessionStorage.setItem(LOCAL_AUTH_VERIFIED_KEY, 'true');
      localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
      setIsLocallyVerified(true);
      setIsSessionExpired(false);
    }
    return ok;
  }, []);

  const removePin = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    setHasPinSet(false);
    // If no biometric either, clear verified state
    if (localStorage.getItem(BIOMETRIC_KEY) !== 'true') {
      sessionStorage.removeItem(LOCAL_AUTH_VERIFIED_KEY);
    }
  }, []);

  const toggleBiometric = useCallback(async (enable: boolean) => {
    if (enable && biometricAvailable) {
      // Test if platform authenticator works
      try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!available) return false;
        localStorage.setItem(BIOMETRIC_KEY, 'true');
        setBiometricEnabled(true);
        return true;
      } catch {
        return false;
      }
    } else {
      localStorage.removeItem(BIOMETRIC_KEY);
      setBiometricEnabled(false);
      if (!localStorage.getItem(PIN_HASH_KEY)) {
        sessionStorage.removeItem(LOCAL_AUTH_VERIFIED_KEY);
      }
      return true;
    }
  }, [biometricAvailable]);

  const verifyBiometric = useCallback(async (): Promise<boolean> => {
    if (!biometricAvailable) return false;
    try {
      // Use WebAuthn for biometric verification
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'TopFocus', id: window.location.hostname },
          user: {
            id: new Uint8Array(16),
            name: 'topfocus-user',
            displayName: 'TopFocus User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      });
      if (credential) {
        sessionStorage.setItem(LOCAL_AUTH_VERIFIED_KEY, 'true');
        localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
        setIsLocallyVerified(true);
        setIsSessionExpired(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [biometricAvailable]);

  const markVerified = useCallback(() => {
    sessionStorage.setItem(LOCAL_AUTH_VERIFIED_KEY, 'true');
    localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
    setIsLocallyVerified(true);
    setIsSessionExpired(false);
  }, []);

  return {
    hasPinSet,
    biometricEnabled,
    biometricAvailable,
    isLocallyVerified,
    isSessionExpired,
    needsLocalAuth,
    setPin,
    verifyPin,
    removePin,
    toggleBiometric,
    verifyBiometric,
    markVerified,
  };
}
