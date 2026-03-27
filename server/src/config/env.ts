import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  turnSecret: string;
  corsOrigin?: string;
}

function getEnvConfig(): EnvConfig {
  const port = parseInt(process.env.PORT || '8080', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const jwtSecret = process.env.JWT_SECRET;
  const turnSecret = process.env.TURN_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (!turnSecret) {
    throw new Error('TURN_SECRET environment variable is required');
  }

  const corsOrigin = process.env.CORS_ORIGIN;

  return {
    port,
    nodeEnv,
    jwtSecret,
    turnSecret,
    corsOrigin,
  };
}

export const env = getEnvConfig();
