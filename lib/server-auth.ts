import { adminAuth } from "@/lib/firebase-admin";

const configuredAdmins = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export async function requireAdmin(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new Error("UNAUTHORIZED");

  const decoded = await adminAuth.verifyIdToken(token);
  const allowedByEmail = configuredAdmins().includes((decoded.email ?? "").toLowerCase());
  if (decoded.admin !== true && !allowedByEmail) throw new Error("FORBIDDEN");
  return decoded;
}
