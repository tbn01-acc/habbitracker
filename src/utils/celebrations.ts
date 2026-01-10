import confetti from 'canvas-confetti';
import { getCelebrationSettings } from '@/hooks/useCelebrationSettings';

// Sound effects URLs (using base64 for small sounds or CDN)
const SOUNDS = {
  success: 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY3MuY29tAFRYWFgAAAAMAAADVGl0bGUAQ2xpY2sAVFhYWAAAAA0AAANBcnRpc3QAVXNlcgBUWFhYAAAADgAAA0FsYnVtAFNvdW5kAP/7kGQAAAAAADQAAAAAAAAANAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/7kGQAAAAAADQAAAAgAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL/+5JkAAAC6AFEpRgAAAEQB5PgAAAADAA0/8AAACABl/4AAAD/+1BkAACZoKY/4wQAgkOgKz/ggFBGQon/iAACCIhQx/EBAEb/0BN/0ATEBMRP/QQBARD/kBAEQEH/ICAIAICP+AEMB/4AAYCD/AAAAAAAAD/+xBEABgBABH/gAAAgYAKf+AAACAB0b/4AAARhAMl/4AAIH/+5DEAAAAANIAAAAAAAAAyAAAAA/QAAAA/+UAAAD/0AAAA/8AAP/kAAD/5AAP/+IAAP/lQAD/5QAA/+AAAP/lAAD/5AAA/+QAAP/kAAD/5AAA/+QAAP/kQAD/5AAA/+QAAP/hAAD/4AAA/+UAAH/lAAD/4QAA/+UAAP/hAAD/5QAA',
  purchase: 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY3MuY29tAFRYWFgAAAAMAAADVGl0bGUAQ29pbgBUWFhYAAAADQAAA0FydGlzdABVc2VyAFRYWFgAAAAOAAADQWxidW0AU291bmQA//uSZAAAAuxBSKU8AIAIIALPwAAAAwANHfDwAAAgAAt+HAAAEExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==',
};

// Preload sounds
const audioCache: Record<string, HTMLAudioElement> = {};

function getAudio(soundType: keyof typeof SOUNDS): HTMLAudioElement {
  if (!audioCache[soundType]) {
    audioCache[soundType] = new Audio(SOUNDS[soundType]);
    audioCache[soundType].volume = 0.3;
  }
  return audioCache[soundType];
}

export function playSuccessSound() {
  const settings = getCelebrationSettings();
  if (!settings.soundEnabled) return;
  
  try {
    const audio = getAudio('success');
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    // Ignore audio errors
  }
}

export function playPurchaseSound() {
  const settings = getCelebrationSettings();
  if (!settings.soundEnabled) return;
  
  try {
    const audio = getAudio('purchase');
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    // Ignore audio errors
  }
}

export function triggerCompletionCelebration() {
  const settings = getCelebrationSettings();
  
  if (settings.soundEnabled) {
    playSuccessSound();
  }
  
  if (settings.confettiEnabled) {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#22c55e', '#4ade80'],
      scalar: 0.8,
    });
  }
}

export function triggerPurchaseCelebration() {
  const settings = getCelebrationSettings();
  
  if (settings.soundEnabled) {
    playPurchaseSound();
  }
  
  if (settings.confettiEnabled) {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#8b5cf6', '#10b981', '#3b82f6'],
    });
  }
}

export function triggerBigCelebration() {
  const settings = getCelebrationSettings();
  
  if (settings.soundEnabled) {
    playSuccessSound();
  }
  
  if (!settings.confettiEnabled) return;
  
  const duration = 1500;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#fbbf24', '#f59e0b', '#eab308'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#8b5cf6', '#a855f7', '#c084fc'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
