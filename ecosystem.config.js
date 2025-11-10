module.exports = {
  apps: [
    {
      name: 'noor-api',
      cwd: '/var/www/noor/backend-nestjs',
      script: 'dist/backend-nestjs/src/main.js',
      env_file: '/var/www/noor/backend-nestjs/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'noor-web',
      cwd: '/var/www/noor/frontend-nextjs',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
