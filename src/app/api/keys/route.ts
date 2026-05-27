import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { encrypt, decrypt, maskKey } from "@/lib/crypto";

export const dynamic = 'force-dynamic';

// GET — List all keys (masked)
export async function GET() {
  try {
    const prisma = getPrisma();
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "asc" },
    });

    const masked = keys.map((k) => {
      const raw = decrypt(k.keyValue);
      return {
        id: k.id,
        provider: k.provider,
        label: k.label,
        maskedKey: maskKey(raw),
        selectedModel: k.selectedModel,
        isActive: k.isActive,
        isSelected: k.isSelected,
        isExhausted: k.isExhausted,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      };
    });

    return NextResponse.json({ success: true, keys: masked });
  } catch (error: any) {
    console.error("GET /api/keys error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Add a new key
export async function POST(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { provider, label, keyValue, selectedModel } = body;

    if (!provider || !keyValue) {
      return NextResponse.json({ error: "provider and keyValue are required" }, { status: 400 });
    }

    const encrypted = encrypt(keyValue);

    // If this is the first key, auto-select it
    const existingCount = await prisma.apiKey.count();

    const key = await prisma.apiKey.create({
      data: {
        provider,
        label: label || `${provider} key`,
        keyValue: encrypted,
        selectedModel,
        isSelected: existingCount === 0,
      },
    });

    const raw = decrypt(key.keyValue);
    return NextResponse.json({
      success: true,
      key: {
        id: key.id,
        provider: key.provider,
        label: key.label,
        maskedKey: maskKey(raw),
        selectedModel: key.selectedModel,
        isActive: key.isActive,
        isSelected: key.isSelected,
        isExhausted: key.isExhausted,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/keys error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH — Update a key (edit key value, toggle active, select, or reset exhaustion)
export async function PATCH(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { id, keyValue, isActive, isSelected, resetExhaustion, selectedModel } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: any = {};

    if (keyValue !== undefined && keyValue !== "") {
      updateData.keyValue = encrypt(keyValue);
      updateData.isExhausted = false; // Reset exhaustion when key is changed
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (selectedModel !== undefined) {
      updateData.selectedModel = selectedModel;
    }

    if (resetExhaustion) {
      updateData.isExhausted = false;
    }

    // If selecting this key, deselect all others first
    if (isSelected === true) {
      await prisma.apiKey.updateMany({ data: { isSelected: false } });
      updateData.isSelected = true;
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: updateData,
    });

    const raw = decrypt(updated.keyValue);
    return NextResponse.json({
      success: true,
      key: {
        id: updated.id,
        provider: updated.provider,
        label: updated.label,
        maskedKey: maskKey(raw),
        selectedModel: updated.selectedModel,
        isActive: updated.isActive,
        isSelected: updated.isSelected,
        isExhausted: updated.isExhausted,
        lastUsedAt: updated.lastUsedAt,
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/keys error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — Remove a key
export async function DELETE(request: Request) {
  try {
    const prisma = getPrisma();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.apiKey.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/keys error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
