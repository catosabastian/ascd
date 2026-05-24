// @ts-nocheck
import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Testing DB Insert...");
  const runId = `test-run-${Date.now()}`;
  try {
    await prisma.threadRun.create({
      data: {
        id: runId,
        videoTitle: "Test Title",
        marketFocus: "crypto",
        platformStyle: "youtube",
        mentionedBrand: "Test",
        chaosLevel: 5,
        memeDensity: 5,
        skepticismLevel: 5,
        softCtaStrength: 5,
        emotionalDrift: "mixed",
        marketCycleMode: "sideways",
      }
    });
    console.log("ThreadRun created.");

    await prisma.persona.create({
      data: {
        id: `test-persona-${Date.now()}`,
        runId,
        username: "testuser",
        archetypeLabel: "test",
        emotionalBehavior: "test",
        grammarQuality: 5,
        slangDensity: 5,
        aggressionLevel: 5,
        emotionalStability: 5,
        backstory: "test backstory",
        avatarSeed: "seed",
      }
    });
    console.log("Persona created.");
    console.log("Success! No Prisma crash.");
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
