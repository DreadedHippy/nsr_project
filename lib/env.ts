export function getEnv(name: string, fallback = "") {
  const value = process.env[name] ?? fallback;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const appUrl = getEnv("APP_URL", "http://localhost:3000");
