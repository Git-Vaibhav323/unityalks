/**
 * Free STUN servers for WebRTC. Used one-at-a-time; if connection establishment
 * takes longer than ESTABLISHMENT_DELAY_THRESHOLD_MS, the next connection (e.g. after skip)
 * will try the next server in the list until a faster one is found.
 */
export const ESTABLISHMENT_DELAY_THRESHOLD_MS = 2500;

export const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.stunprotocol.org:3478' },
  { urls: 'stun:stun.ekiga.net' },
  { urls: 'stun:stun.ideasip.com' },
  { urls: 'stun:stun.schlund.de' },
  { urls: 'stun:stun.voip.blackberry.com:3478' },
  { urls: 'stun:stun.voipbuster.com' },
  { urls: 'stun:stun.voxgratia.org' },
  { urls: 'stun:stun.xten.com' },
  { urls: 'stun:stun.callwithus.com' },
  { urls: 'stun:stun.counterpath.com' },
  { urls: 'stun:stun.internet-call.com' },
  { urls: 'stun:stun.nextcloud.com:443' },
];

/**
 * @param {number} serverIndex - Current STUN server index (0-based). Rotate when establishment delay > threshold.
 * @returns {{ iceServers: Array<{ urls: string }> }}
 */
export function getRtcConfig(serverIndex) {
  const index = Math.abs(serverIndex) % STUN_SERVERS.length;
  return {
    iceServers: [STUN_SERVERS[index]],
  };
}
