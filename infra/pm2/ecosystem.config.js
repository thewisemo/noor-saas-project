module.exports = {
  apps: [
    {
      name: "noor-api",
      script: "dist/main.js",
      cwd: "backend-nestjs",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "noor-web",
      script: "npm",
      args: "run start",
      cwd: "frontend-nextjs",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
}
