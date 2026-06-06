import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || req.headers.get("SAAS_INTERNAL_TOKEN");
    const internalToken = process.env.SAAS_INTERNAL_TOKEN;

    if (!internalToken || (authHeader !== `Bearer ${internalToken}` && authHeader !== internalToken)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: { telegram_bot_active: true },
    });

    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("List Active Courses API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
