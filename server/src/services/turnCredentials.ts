import crypto from 'crypto';

const TURN_TTL_SECONDS = 3600;
const TURN_URLS = ['turn:turn.unitalks.in:3478', 'turn:turn.unitalks.in:3478?transport=tcp'];

export function generateTurnCredentials(userId: string): {
  username: string;
  credential: string;
  ttl: number;
  urls: string[];
} {
  const turnSecret = process.env.TURN_SECRET;
  if (!turnSecret) {
    throw new Error('TURN_SECRET environment variable is required');
  }

  const timestamp = Math.floor(Date.now() / 1000) + TURN_TTL_SECONDS;
  const username = `${timestamp}:${userId}`;
  const credential = crypto.createHmac('sha1', turnSecret).update(username).digest('base64');

  return {
    username,
    credential,
    ttl: TURN_TTL_SECONDS,
    urls: TURN_URLS,
  };
}

