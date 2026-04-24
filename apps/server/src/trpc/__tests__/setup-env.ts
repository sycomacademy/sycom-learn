const defaults = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  CLOUDINARY_CLOUD_NAME: "demo",
  BETTER_AUTH_SECRET: "test-secret-at-least-thirty-two-chars",
  BETTER_AUTH_URL: "http://localhost:3001",
  BETTER_AUTH_API_KEY: "test-api-key",
  RESEND_API_KEY: "test-resend-api-key",
  RESEND_EMAIL_FROM: "noreply@test.local",
  RESEND_EMAIL_REPLY_TO: "support@test.local",
  CORS_ORIGIN: "http://localhost:3000,http://localhost:3002",
  NODE_ENV: "test",
} as const;

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
