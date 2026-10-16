import { scanTemplateDirectory } from "@/modules/playground/lib/path-to-json";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import { auth } from "@/auth";
import path from "path";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Missing playground ID" }, { status: 400 });
  }

  const playground = await db.playground.findFirst({
    where: { id, userId },
    select: { template: true },
  });
  if (!playground) {
    return Response.json({ error: "Playground not found" }, { status: 404 });
  }

  const templatePath = templatePaths[playground.template];
  if (!templatePath) {
    return Response.json({ error: "Invalid template" }, { status: 404 });
  }

  try {
    const templateJson = await scanTemplateDirectory(
      path.join(process.cwd(), templatePath)
    );
    return Response.json({ success: true, templateJson }, { status: 200 });
  } catch (error) {
    console.error("Error generating template JSON:", error);
    return Response.json(
      { error: "Failed to load starter template" },
      { status: 500 }
    );
  }
}
