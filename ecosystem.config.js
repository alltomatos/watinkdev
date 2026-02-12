module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "./backend",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
        DB_DIALECT: "postgres",
        DB_HOST: "localhost",
        DB_PORT: "5432",
        DB_USER: "postgres",
        DB_PASS: "postgres",
        DB_NAME: "watink",
        AMQP_URL: "amqp://guest:guest@localhost:5672",
        REDIS_URL: "redis://localhost:6379",
        PORT: "8080",
        JWT_SECRET: "watink_secret_key_2026",
        JWT_REFRESH_SECRET: "75756756756",
        FRONTEND_URL: "http://localhost:5173", // Default Vite port
        URL_BACKEND: "http://localhost:8080"
      }
    },
    {
      name: "frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run dev",
      env: {
        VITE_BACKEND_URL: "http://localhost:8080/api/"
      }
    }
  ]
};
