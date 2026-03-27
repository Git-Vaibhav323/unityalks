module.exports = {
  apps: [
    {
      name: 'unitalks',
      script: 'server/dist/index.js',
      interpreter: 'node',
      exec_mode: 'cluster',
      instances: 'max',
      max_memory_restart: '180M',
      restart_delay: 2000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        REDIS_URL: process.env.REDIS_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        TURN_SECRET: process.env.TURN_SECRET,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
      },
    },
  ],
};

