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
        NOOR_MASTER_KEY: "7198b9175d079e6b7c6fc87a8cb9a2d23ab5bf85576849c35c8085e5cf9ad319",
        ALLOW_DEFAULT_SUPER_ADMIN_SEED: "false",
        TYPEORM_SYNC: "false"
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
