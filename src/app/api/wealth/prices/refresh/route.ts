import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { refreshPrices } from "@/lib/wealth-prices";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const type = body?.type === "stocks" || body?.type === "crypto" ? body.type : "all";

  try {
    const result = await refreshPrices(user.id, type);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kurse konnten nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}
