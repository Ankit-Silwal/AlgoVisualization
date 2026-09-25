import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasSameOrigin } from "@/lib/request-origin";
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const user = await currentUser(request);
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/i.test(id))
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    const deleted = await db.experiment.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ deleted: deleted.count > 0 }, { status: deleted.count ? 200 : 404 });
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
}
