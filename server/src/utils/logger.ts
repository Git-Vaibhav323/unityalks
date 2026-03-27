import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  // Only log heartbeats/errors/critical info, suppress debug noise
  if (level === 'debug' && !message.includes('Heartbeat')) {
    return;
  }
  
  if (env.nodeEnv === 'production') {
    console.log(JSON.stringify({ level, message, data: args }));
  } else {
    console.log(`[${new Date().toISOString()}] [${level.toUpperCase()}]`, message, ...args);
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => log('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
};
