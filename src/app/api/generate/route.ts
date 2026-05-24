import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { generateThread, type ThreadConfig } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log(">>> POST /api/generate hit!");
  try {
    const prisma = getPrisma();
    const body: ThreadConfig = await request.json();
    console.log(">>> Body parsed:", JSON.stringify(body));
    const { videoTitle, marketFocus, platformStyle, mentionedBrand, chaosLevel, memeDensity, skepticismLevel, softCtaStrength, emotionalDrift, marketCycleMode } = body;

    if (!videoTitle || !marketFocus || !platformStyle || !mentionedBrand) {
      console.log(">>> Missing required fields!");
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(">>> Calling generateThread...");
    const result = await generateThread(body);
    console.log(">>> generateThread succeeded. comments:", result.comments.length, "personas:", result.personas.length);
    const runId = `run-${Date.now()}`;

    // Save to database
    try {
      await prisma.threadRun.create({
        data: {
          id: runId,
          videoTitle,
          marketFocus,
          platformStyle,
          mentionedBrand,
          chaosLevel: chaosLevel || 5,
          memeDensity: memeDensity || 5,
          skepticismLevel: skepticismLevel || 5,
          softCtaStrength: softCtaStrength || 5,
          emotionalDrift: emotionalDrift || 'mixed',
          marketCycleMode: marketCycleMode || 'sideways boredom',
          avgSentiment: result.metrics.avgSentiment,
          avgToxicity: result.metrics.avgToxicity,
          engagementScore: result.metrics.engagementScore,
          controversyIndex: result.metrics.controversyIndex,
        },
      });
    } catch (e) {
      console.error("DATABASE FAIL (ThreadRun):", e);
    }

    // Insert personas
    for (const p of result.personas) {
      try {
        await prisma.persona.create({
          data: {
            id: p.id,
            runId,
            username: p.username,
            archetypeLabel: p.archetypeLabel,
            emotionalBehavior: p.emotionalBehavior,
            grammarQuality: p.grammarQuality,
            slangDensity: p.slangDensity,
            aggressionLevel: p.aggressionLevel,
            emotionalStability: p.emotionalStability,
            backstory: p.backstory,
            avatarSeed: p.avatarSeed,
          },
        });
      } catch (e) {
        console.error(`DATABASE FAIL (Persona: ${p.id}):`, e);
      }
    }

    // Insert comments
    for (const c of result.comments) {
      try {
        await prisma.comment.create({
          data: {
            id: c.id,
            runId,
            personaId: c.personaId,
            content: c.content,
            parentId: c.parentId,
            timestampOffset: c.timestampOffset,
            likes: c.likes,
            dislikes: c.dislikes,
            sentiment: c.sentiment,
            toxicity: c.toxicity,
            orderIndex: c.orderIndex,
          },
        });
      } catch (e) {
        console.error(`DATABASE FAIL (Comment: ${c.id}, persona: ${c.personaId}):`, e);
      }
    }

    return NextResponse.json({
      success: true,
      runId,
      personas: result.personas,
      comments: result.comments,
      metrics: result.metrics,
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
