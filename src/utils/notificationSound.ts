/**
 * Notification sound utility using Web Audio API.
 * Generates pleasant notification tones without external audio files.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

type NotificationType = "success" | "info" | "warning";

const TONES: Record<NotificationType, { frequencies: number[]; durations: number[]; volume: number }> = {
  success: {
    frequencies: [587.33, 783.99, 1046.5], // D5, G5, C6 — ascending happy chime
    durations: [0.12, 0.12, 0.2],
    volume: 0.15,
  },
  info: {
    frequencies: [523.25, 659.25], // C5, E5 — gentle two-tone
    durations: [0.15, 0.2],
    volume: 0.12,
  },
  warning: {
    frequencies: [440, 440], // A4 double beep
    durations: [0.1, 0.1],
    volume: 0.1,
  },
};

export function playNotificationSound(type: NotificationType = "info"): void {
  try {
    const ctx = getAudioContext();
    const tone = TONES[type];
    let startTime = ctx.currentTime;

    tone.frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(tone.volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + tone.durations[i]);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + tone.durations[i] + 0.05);

      startTime += tone.durations[i] + 0.05;
    });
  } catch {
    // Silently fail if audio is not available
  }
}
