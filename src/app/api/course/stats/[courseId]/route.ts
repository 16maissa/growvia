import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.userId !== session.userId) {
      return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 });
    }

    // 1. Total interactions count
    const totalQuestions = await prisma.telegramInteraction.count({
      where: { courseId },
    });

    // 2. Fetch all questions to find frequencies
    const interactions = await prisma.telegramInteraction.findMany({
      where: { courseId },
      select: { question: true },
    });

    // Calculate frequencies
    const frequencyMap: Record<string, number> = {};
    for (const int of interactions) {
      // Normalize question slightly (lowercase, trim) to group similar ones
      const q = int.question.trim().toLowerCase();
      frequencyMap[q] = (frequencyMap[q] || 0) + 1;
    }

    // Sort by frequency
    const sortedQuestions = Object.entries(frequencyMap)
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count);

    const topFrequent = sortedQuestions.slice(0, 5);
    const reelSuggestions = sortedQuestions.filter(q => q.count >= 3);

    return NextResponse.json({
      totalQuestions,
      topFrequent,
      reelSuggestions,
    });
  } catch (error) {
    console.error("Course Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
