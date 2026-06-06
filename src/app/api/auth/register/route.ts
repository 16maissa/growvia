import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    console.log("🟢 REGISTER START");

    const { name, email, password } = await req.json();
    console.log("📩 Data:", { name, email });

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      console.log("⚠️ User already exists");
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userProfile: {
          create: {
            plan: "libre",
            setup_done: false,
          },
        },
        automationPrefs: {
          create: {
            mode: "libre",
          },
        },
      },
      include: {
        userProfile: true,
        automationPrefs: true,
      },
    });

    console.log("👤 User created:", user.id);

    const payload = {
      userId: user.id,
      email: user.email,
      plan: user.userProfile?.plan,
      setup_done: user.userProfile?.setup_done,
    };

    const sessionToken = await encrypt(payload);

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });

    res.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: false, // 🔥 FIX VPS HTTP
      sameSite: "lax",
      path: "/",
    });

    console.log("✅ REGISTER SUCCESS");

    return res;
  } catch (error: any) {
    console.error("💥 Register Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}