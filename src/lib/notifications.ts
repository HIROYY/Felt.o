/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClinicalReport } from '../types';
import { LOGO_URL } from './db';

const BROADCAST_CHANNEL_NAME = 'felto_clinical_alerts';

// Audio chime using Web Audio API (no external file needed, 100% reliable)
export function playAlertChime(isCritical: boolean = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (isCritical) {
      // 2-tone urgent warm chime (D5 -> A5 -> D6)
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    } else {
      // Soft gentle chime
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.2);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    }

    osc1.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + (isCritical ? 0.65 : 0.55));
  } catch (err) {
    // Ignore autoplay or audio context errors
  }
}

// Check native Notification API availability
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission to user
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

// Trigger native browser notification
export function sendNativeCriticalNotification(
  report: ClinicalReport,
  onNavigateToAlerts?: () => void
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    playAlertChime(report.nivelGravedad === 'Alta');

    const title = `🚨 Alerta Clínica Crítica: ${report.pacienteNombre}`;
    const body = `Gravedad Alta (${report.puntuacionRiesgo}/5) - ${report.emocionDetectada}:\n"${report.fragmentoMensaje || report.resumenClinico}"`;

    const notification = new Notification(title, {
      body,
      icon: LOGO_URL,
      badge: LOGO_URL,
      tag: `felto-crit-${report.id}`,
      requireInteraction: true // Remains visible until the clinician clicks or dismisses it
    });

    notification.onclick = () => {
      window.focus();
      if (onNavigateToAlerts) {
        onNavigateToAlerts();
      } else {
        window.location.hash = 'alertas';
      }
      notification.close();
    };

    return true;
  } catch (err) {
    console.error('Error dispatching native notification:', err);
    return false;
  }
}

// Broadcast high severity alerts across tabs/instances
let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  channel = null;
}

export function broadcastCriticalAlert(report: ClinicalReport) {
  if (channel) {
    try {
      channel.postMessage({
        type: 'FELTO_CRITICAL_REPORT',
        report,
        timestamp: Date.now()
      });
    } catch (err) {
      console.warn('Error broadcasting alert:', err);
    }
  }

  // Also dispatch window custom event for same-page components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('felto:critical-report', {
        detail: report
      })
    );
    window.dispatchEvent(
      new CustomEvent('felto:db-updated', {
        detail: { report, timestamp: Date.now() }
      })
    );
  }
}

export function broadcastDBSync() {
  if (channel) {
    try {
      channel.postMessage({
        type: 'FELTO_DB_SYNC',
        timestamp: Date.now()
      });
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('felto:db-updated', {
        detail: { timestamp: Date.now() }
      })
    );
  }
}

export function subscribeToCriticalAlerts(callback: (report: ClinicalReport) => void): () => void {
  const handleWindowCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<ClinicalReport>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  const handleChannelMessage = (event: MessageEvent) => {
    if (event.data?.type === 'FELTO_CRITICAL_REPORT' && event.data.report) {
      callback(event.data.report);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('felto:critical-report', handleWindowCustomEvent);
  }

  if (channel) {
    channel.addEventListener('message', handleChannelMessage);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('felto:critical-report', handleWindowCustomEvent);
    }
    if (channel) {
      channel.removeEventListener('message', handleChannelMessage);
    }
  };
}

