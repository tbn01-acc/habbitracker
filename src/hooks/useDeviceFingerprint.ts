import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a hash from a string using SubtleCrypto
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate canvas fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('TopFocus fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('TopFocus fingerprint', 4, 17);
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

/**
 * Generate WebGL fingerprint
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl || !(gl instanceof WebGLRenderingContext)) return '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    return `${vendor}~${renderer}`;
  } catch {
    return '';
  }
}

/**
 * Get installed fonts fingerprint (simplified)
 */
function getFontsFingerprint(): string {
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Lucida Console',
    'Tahoma', 'Palatino Linotype', 'Segoe UI', 'Roboto',
  ];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const detected: string[] = [];
  const baseWidth = ctx.measureText('mmmmmmmmmmlli').width;
  ctx.font = '72px monospace';
  const baseMonospace = ctx.measureText('mmmmmmmmmmlli').width;

  for (const font of testFonts) {
    ctx.font = `72px '${font}', monospace`;
    const width = ctx.measureText('mmmmmmmmmmlli').width;
    if (width !== baseMonospace) {
      detected.push(font);
    }
  }
  return detected.join(',');
}

/**
 * Collect all fingerprint components and generate a composite hash
 */
async function generateFingerprint() {
  const components = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(',') || '',
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset().toString(),
    cookiesEnabled: navigator.cookieEnabled.toString(),
    doNotTrack: navigator.doNotTrack || '',
    hardwareConcurrency: navigator.hardwareConcurrency?.toString() || '',
    maxTouchPoints: navigator.maxTouchPoints?.toString() || '',
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
    fonts: getFontsFingerprint(),
  };

  const rawString = Object.values(components).join('|||');
  const fingerprintHash = await hashString(rawString);

  return {
    fingerprint_hash: fingerprintHash,
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    canvas_hash: components.canvas ? await hashString(components.canvas) : null,
    webgl_hash: components.webgl ? await hashString(components.webgl) : null,
    fonts_hash: components.fonts ? await hashString(components.fonts) : null,
  };
}

/**
 * Hook that automatically captures and stores device fingerprint for the current user.
 * Also checks if the device is banned.
 */
export function useDeviceFingerprint(userId: string | undefined) {
  const captureFingerprint = useCallback(async () => {
    if (!userId) return;

    try {
      const fp = await generateFingerprint();

      // Check if this fingerprint is banned
      const { data: banned } = await supabase
        .from('banned_fingerprints')
        .select('id')
        .eq('fingerprint_hash', fp.fingerprint_hash)
        .limit(1);

      if (banned && banned.length > 0) {
        console.warn('⚠️ This device is associated with a banned account');
        // Could sign out the user here if needed
      }

      // Upsert fingerprint
      const { data: existing } = await supabase
        .from('device_fingerprints')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('device_fingerprints')
          .update({
            ...fp,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('device_fingerprints')
          .insert({
            user_id: userId,
            ...fp,
          });
      }
    } catch (err) {
      console.error('Fingerprint capture error:', err);
    }
  }, [userId]);

  useEffect(() => {
    // Delay fingerprint capture to not block initial render
    const timer = setTimeout(captureFingerprint, 3000);
    return () => clearTimeout(timer);
  }, [captureFingerprint]);
}
