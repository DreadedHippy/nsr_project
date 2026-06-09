import "server-only";
import crypto from "crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const configured = process.env.NIN_ENCRYPTION_KEY;
  if (configured) {
    return crypto.createHash("sha256").update(configured).digest();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NIN_ENCRYPTION_KEY is required in production.");
  }

  return crypto.createHash("sha256").update("local-development-key").digest();
}

export function maskNin(nin: string) {
  return `${nin.slice(0, 3)}****${nin.slice(-4)}`;
}

export function hashNin(nin: string) {
  return crypto.createHash("sha256").update(nin).digest("hex");
}

export function encryptText(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptText(payload: string) {
  const [iv, tag, encrypted] = payload.split(".").map((part) => Buffer.from(part, "base64"));
  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function encryptJson(value: unknown) {
  return encryptText(JSON.stringify(value));
}
