const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating AutomationPrefs mode...");
  await prisma.$executeRawUnsafe(`UPDATE "AutomationPrefs" SET "mode" = 'libre' WHERE "mode" = 'guide';`);
  await prisma.$executeRawUnsafe(`UPDATE "AutomationPrefs" SET "mode" = 'semi_auto' WHERE "mode" = 'semi';`);
  
  console.log("Updating AgentTask status...");
  await prisma.$executeRawUnsafe(`UPDATE "AgentTask" SET "status" = 'done' WHERE "status" = 'approved';`);
  await prisma.$executeRawUnsafe(`UPDATE "AgentTask" SET "status" = 'pending' WHERE "status" = 'waiting_dependency';`);
  
  console.log("Data migration prep complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
