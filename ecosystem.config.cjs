module.exports = {
  apps: [
    {
      name: 'avcsoluciones',
      cwd: '/var/www/avcsoluciones',
      script: './server/server.mjs',
      interpreter: 'node',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3550,
        STATIC_DIR: './dist',
        DATA_DIR: './data',
        UPLOAD_DIR: './data/uploads',
        DB_PATH: './data/db.json',
        MAX_UPLOAD_MB: 10,
      },
    },
  ],
};
