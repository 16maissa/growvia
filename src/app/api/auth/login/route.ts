import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    console.log("[LOGIN] email:", email);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { userProfile: true },
    });

    if (!user) {
      console.log("[LOGIN] user not found");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.password) {
      console.log("[LOGIN] missing password in DB");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("[LOGIN] user found:", user.id);

    const ok = await bcrypt.compare(password, user.password);

    console.log("[LOGIN] password valid:", ok);

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await encrypt({
      userId: user.id,
      email: user.email,
      plan: user.userProfile?.plan,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });

    res.cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false, // VPS HTTP
    });

    console.log("[LOGIN] cookie SET OK");

    return res;
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}