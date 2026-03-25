import type { WebSocket } from 'ws';

export interface JWTPayload {
  userId: string;
  type: 'anonymous';
  iat: number;
  exp: number;
}

export enum UserState {
  IDLE = 'idle',
  SEARCHING = 'searching',
  CONNECTED = 'connected',
  SKIPPED = 'skipped', 
  DISCONNECTED = 'disconnected'
}

export type ClientMessage =
  | { type: 'join'; mode?: 'video' | 'audio' | 'text' }
  | { type: 'signal'; signalType: 'offer' | 'answer' | 'ice'; data: unknown }
  | { type: 'skip' }
  | { type: 'leave' }
  | { type: 'cancel' }
  | { type: 'acknowledge' }
  | { type: 'pong' }
  | { type: 'fun-request'; game: string }
  | { type: 'fun-accept'; game: string }
  | { type: 'fun-reject' }
  | { type: 'fun-exit' };

export type ServerMessage =
  | { type: 'ready'; userId: string }
  | { type: 'matched'; partnerId: string; initiator: boolean; sessionId: string }
  | { type: 'signal'; from: string; signalType: 'offer' | 'answer' | 'ice'; data: unknown }
  | { type: 'partner-left' }
  | { type: 'partner-skipped' }
  | { type: 'queue'; position: number }
  | { type: 'session-ready' }
  | { type: 'search-cancelled' }
  | { type: 'error'; message: string }
  | { type: 'ping' }
  | { type: 'fun-request'; from: string; game: string }
  | { type: 'fun-accept'; from: string; game: string }
  | { type: 'fun-reject'; from: string }
  | { type: 'fun-exit'; from: string };

export interface Session {
  sessionId: string;
  userA: string;
  userB: string;
  createdAt: number;
  lastActivity: number;
  acknowledgedBy: Set<string>;
  state: 'pending' | 'active' | 'ended';
  mode: 'video' | 'audio' | 'text';
}

export interface QueueEntry {
  userId: string;
  enqueuedAt: number;
}

export interface UserRecord {
  userId: string;
  ws: WebSocket;
  state: UserState;
  sessionId?: string;
  lastPong: number;
  skipCount: number;
  lastSkipTime: number;
  enqueuedAt?: number;
  mode: 'video' | 'audio' | 'text';
}

export interface WsClient extends WebSocket {
  isAlive: boolean;
  userId: string;
}
