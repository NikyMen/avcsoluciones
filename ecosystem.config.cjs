module.exports = {
  apps: [
    {
      name: 'avcsoluciones',
      cwd: 'D:/dev/avcsoluciones',
      script: 'node_modules/astro/astro.js',
      args: 'preview --port 3550 --host',
      interpreter: 'node',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
