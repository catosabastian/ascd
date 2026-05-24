// @ts-nocheck
import { prisma } from "./src/lib/prisma";

async function main() {
  const latestRun = await prisma.threadRun.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { comments: { include: { persona: true } } }
  });

  if (!latestRun) {
    console.log("No runs found.");
    return;
  }

  console.log(`=== RUN: ${latestRun.videoTitle} (Entity: ${latestRun.mentionedBrand}) ===`);
  // Sort comments by orderIndex or reconstruct tree
  const sorted = latestRun.comments.sort((a,b) => a.orderIndex - b.orderIndex);
  sorted.forEach(c => {
    const parentText = c.parentId ? `[Replying to comment ID ${c.parentId.slice(-6)}]` : "[OP ROOT]";
    console.log(`\n[@${c.persona.username}] ${parentText}`);
    console.log(`   ${c.content}`);
  });
}

main();
