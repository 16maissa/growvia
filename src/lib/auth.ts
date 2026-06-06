import { decrypt } from "./jwt";
import { NextRequest } from "next/server";

export async function getSession(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value;

    console.log("[AUTH] cookie token:", token);

    if (!token) {
      console.log("[AUTH] NO COOKIE");
      return null;
    }

    const session = await decrypt(token);

    if (!session) {
      console.log("[AUTH] INVALID SESSION");
      return null;
    }

    return session;
  } catch (err) {
    console.log("[AUTH] ERROR:", err);
    return null;
  }
}