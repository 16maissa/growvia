import { getSession } from "@/lib/auth";
import { LandingPageClient } from "./LandingPageClient";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  let isLoggedIn = false;

  if (session?.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true }
    });
    if (user) isLoggedIn = true;
  }
  
  return <LandingPageClient isLoggedIn={isLoggedIn} />;
}
