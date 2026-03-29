import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { ClientOrderModel } from "@/models/ClientOrder";
import "@/models/ClientSku";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "client");
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const rows = await ClientOrderModel.find({
    clientId: auth.sub,
    delivered: true,
  })
    .populate("skuId", "name description imageUrl")
    .sort({ deliveryDate: -1, createdAt: -1 })
    .lean();

  return NextResponse.json(
    { orders: rows },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
