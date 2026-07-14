module.exports = {
  apps: [
    {
      name: 'avcsoluciones',
      cwd: '/var/www/avcsoluciones',
      script: './server/server.mjs',
      interpreter: 'node',
      autorestart: true,
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
