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

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await encrypt({
      userId: user.id,
      email: user.email,
      plan: user.userProfile?.plan || "libre",
      isAdmin: user.isAdmin ?? false,
    });

    const res = NextResponse.json({
      success: true,
      isAdmin: user.isAdmin ?? false,
      user: { id: user.id, email: user.email },
    });

    res.cookies.set("session", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });

    console.log("[LOGIN] OK — isAdmin:", user.isAdmin);
    return res;
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
