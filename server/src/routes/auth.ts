import { Router, Request, Response } from 'express';
import { generateToken } from '../config/jwt';
import { logger } from '../utils/logger';

const router = Router();

router.post('/token', (_req: Request, res: Response) => {
  try {
    const { token, expiresIn } = generateToken();
    
    logger.info('Generated new anonymous token');
    
    res.json({
      token,
      expiresIn,
    });
  } catch (error) {
    logger.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
    });
  }
});

export default router;
