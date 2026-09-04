import { adminDb } from "@/lib/firebase-admin";

export async function hasContractAccess(token: unknown, collection: "contracts" | "stayContracts") {
  if (typeof token !== "string" || token.length < 20) return false;
  const snapshot = await adminDb.collection(collection).where("token", "==", token).limit(1).get();
  return !snapshot.empty;
}
