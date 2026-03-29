import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-auth";
import { uploadBufferToS3 } from "@/lib/s3";

const folderSchema = z.enum(["skus", "invoices"]);

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "admin");
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const folderValue = formData.get("folder");
    const fileValue = formData.get("file");

    const folder = folderSchema.parse(folderValue);

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (fileValue.size === 0) {
      return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
    }

    const bytes = await fileValue.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { publicUrl, key } = await uploadBufferToS3({
      folder,
      fileName: fileValue.name,
      contentType: fileValue.type,
      body: buffer,
    });

    return NextResponse.json({
      ok: true,
      key,
      url: publicUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
