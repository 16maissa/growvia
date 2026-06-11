import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL || "https://growvia.network"));
  res.cookies.delete("session");
  return res;
}
