import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const run = await prisma.threadRun.findUnique({
      where: { id },
      include: {
        personas: true,
        comments: { orderBy: { orderIndex: 'asc' } },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    console.error('Thread detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
