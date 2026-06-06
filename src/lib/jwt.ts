import { SignJWT, jwtVerify } from "jose";

const secretKey =
  process.env.JWT_SECRET || "dev-secret-change-me";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  console.log("[JWT] encrypt payload:", payload);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    console.log("[JWT] decrypt OK:", payload);
    return payload;
  } catch (err) {
    console.log("[JWT] decrypt FAILED");
    return null;
  }
}