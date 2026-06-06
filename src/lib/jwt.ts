import { SignJWT, jwtVerify } from "jose";

const secretKey =
  process.env.JWT_SECRET || "dev-secret-change-me";
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  email?: string;
  exp?: number;
  iat?: number;
}

export async function encrypt(payload: any) {
  console.log("[JWT] encrypt payload:", payload);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as SessionPayload;
  } catch (err) {
    console.log("[JWT] decrypt FAILED");
    return null;
  }
}