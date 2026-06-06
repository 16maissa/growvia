import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Course name is required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        userId: session.userId,
        name,
        description,
      },
    });

    return NextResponse.json({ id: course.id, name: course.name });
  } catch (error) {
    console.error("Course Create Error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
