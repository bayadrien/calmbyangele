import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = "calm_gallery";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

type GallerySession = { slug: string; expiresAt: number };

function sessionSecret() {
  const secret = process.env.GALLERY_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("GALLERY_SESSION_SECRET must contain at least 32 characters");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export async function hashGalleryCode(code: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(code, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function matchesGalleryCode(code: string, storedHash?: string, legacyCode?: string) {
  if (storedHash) {
    const [salt, expected] = storedHash.split(":");
    if (!salt || !expected) return false;
    const derived = (await scrypt(code, salt, 64)) as Buffer;
    const expectedBuffer = Buffer.from(expected, "hex");
    return expectedBuffer.length === derived.length && timingSafeEqual(expectedBuffer, derived);
  }

  // Compatibility for existing records. Once the code has been used, callers migrate it.
  if (!legacyCode) return false;
  const supplied = Buffer.from(code);
  const existing = Buffer.from(legacyCode);
  return supplied.length === existing.length && timingSafeEqual(supplied, existing);
}

export function createGallerySession(slug: string) {
  const session: GallerySession = { slug, expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readGallerySession(value?: string): GallerySession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GallerySession;
    return session.expiresAt > Math.floor(Date.now() / 1000) ? session : null;
  } catch {
    return null;
  }
}

export const galleryCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
