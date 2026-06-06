import { cookies } from "next/headers";
import { decrypt } from "./jwt";

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    console.log("[AUTH] token:", token ? "EXISTS" : "MISSING");

    if (!token) return null;

    const session = await decrypt(token);

    console.log("[AUTH] session:", session);

    return session;
  } catch (err) {
    console.error("[AUTH ERROR]", err);
    return null;
  }
}