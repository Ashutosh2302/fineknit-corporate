import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { AdminModel } from "@/models/Admin";
import { ClientModel } from "@/models/Client";

export async function requireAdminPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "admin") {
    redirect("/admin");
  }

  await connectToDatabase();
  const admin = await AdminModel.findById(session.sub).lean();
  if (!admin) {
    redirect("/admin");
  }

  return admin;
}

export async function requireClientPage() {
  const session = await getSessionFromCookie();
  if (!session || session.role !== "client") {
    redirect("/login?portal=client");
  }

  await connectToDatabase();
  const client = await ClientModel.findById(session.sub).lean();
  if (!client) {
    redirect("/login?portal=client");
  }

  return client;
}
