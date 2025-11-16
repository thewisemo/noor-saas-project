module.exports = {
  apps: [
    {
      name: 'noor-backend',
      cwd: './backend-nestjs',
      script: 'dist/main.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'noor-web',
      cwd: './frontend-nextjs',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
