import { NextRequest, NextResponse } from "next/server";
import { getSchemeById } from "@/lib/schemes";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Scheme id parameter is required" },
        { status: 400 }
      );
    }

    const scheme = getSchemeById(id);

    if (!scheme) {
      return NextResponse.json(
        {
          success: false,
          message: `Scheme with id '${id}' not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: scheme,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve scheme";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

