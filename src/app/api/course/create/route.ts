import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    console.log("[COURSE] create request");

    const session = await getSession();

    console.log("[COURSE] session:", session);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized (no session)" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Course name is required" },
        { status: 400 }
      );
    }

    const userId = String(session.userId);

    console.log("[COURSE] creating for user:", userId);

    const course = await prisma.course.create({
      data: {
        userId,
        name,
        description: description || "",
      },
    });

    console.log("[COURSE] created:", course.id);

    return NextResponse.json({
      success: true,
      id: course.id,
      name: course.name,
    });
  } catch (error) {
    console.error("[COURSE ERROR]", error);

    return NextResponse.json(
      { error: "Failed to create course", details: String(error) },
      { status: 500 }
    );
  }
}