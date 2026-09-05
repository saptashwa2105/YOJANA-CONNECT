import { NextRequest, NextResponse } from "next/server";
import { resolveUser, addUserBookmark, removeUserBookmark } from "@/lib/db";
import { getSchemeById, resolveCanonicalSchemeId } from "@/lib/schemes";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ schemeId: string }> }
) {
  try {
    const user = await resolveUser(req);
    const params = await context.params;
    const rawSchemeId = params.schemeId;

    if (!rawSchemeId) {
      return NextResponse.json(
        { success: false, message: "schemeId parameter is required" },
        { status: 400 }
      );
    }

    const canonicalId = resolveCanonicalSchemeId(rawSchemeId) || rawSchemeId;
    const scheme = getSchemeById(canonicalId);

    if (!scheme) {
      return NextResponse.json(
        {
          success: false,
          message: `Scheme with id '${rawSchemeId}' not found`,
        },
        { status: 404 }
      );
    }

    const { bookmark, isAlreadyBookmarked } = await addUserBookmark(user, canonicalId);

    if (isAlreadyBookmarked) {
      return NextResponse.json(
        {
          success: false,
          message: `Scheme '${canonicalId}' is already bookmarked by user #${user.id}`,
          data: bookmark,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Scheme '${canonicalId}' bookmarked successfully`,
        data: bookmark,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add bookmark";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ schemeId: string }> }
) {
  try {
    const user = await resolveUser(req);
    const params = await context.params;
    const rawSchemeId = params.schemeId;

    if (!rawSchemeId) {
      return NextResponse.json(
        { success: false, message: "schemeId parameter is required" },
        { status: 400 }
      );
    }

    const removed = await removeUserBookmark(user, rawSchemeId);

    if (!removed) {
      return NextResponse.json(
        {
          success: false,
          message: `Bookmark for scheme '${rawSchemeId}' not found for user #${user.id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Bookmark for '${rawSchemeId}' removed successfully`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete bookmark";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

