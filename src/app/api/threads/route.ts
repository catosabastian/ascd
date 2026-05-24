import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const runs = await prisma.threadRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        comments: { select: { id: true } },
        personas: { select: { id: true } },
      },
    });

    const mapped = runs.map(r => ({
      id: r.id,
      createdAt: r.createdAt,
      videoTitle: r.videoTitle,
      marketFocus: r.marketFocus,
      platformStyle: r.platformStyle,
      mentionedBrand: r.mentionedBrand,
      chaosLevel: r.chaosLevel,
      commentCount: r.comments.length,
      personaCount: r.personas.length,
      avgSentiment: r.avgSentiment,
      avgToxicity: r.avgToxicity,
    }));

    return NextResponse.json({ success: true, runs: mapped });
  } catch (error: any) {
    console.error('Threads list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.comment.deleteMany();
    await prisma.persona.deleteMany();
    await prisma.threadRun.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
