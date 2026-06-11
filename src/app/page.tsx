import { getSession } from "@/lib/auth";
import { LandingPageClient } from "./LandingPageClient";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true }
    });
    if (user) redirect("/dashboard");
  }

  return <LandingPageClient isLoggedIn={false} />;
}
