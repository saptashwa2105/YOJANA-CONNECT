import { NextRequest, NextResponse } from "next/server";
import { resolveUser, getUserBookmarks, addUserBookmark } from "@/lib/db";
import { getSchemeById, resolveCanonicalSchemeId } from "@/lib/schemes";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    const bookmarks = await getUserBookmarks(user);

    return NextResponse.json({
      success: true,
      userId: user.id,
      count: bookmarks.length,
      data: bookmarks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load bookmarks";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    let rawSchemeId: string | null = null;

    try {
      const body = await req.json();
      rawSchemeId = body.schemeId;
    } catch {
      // Body might be empty, check searchParams
    }

    if (!rawSchemeId) {
      const url = new URL(req.url);
      rawSchemeId = url.searchParams.get("schemeId");
    }

    if (!rawSchemeId) {
      return NextResponse.json(
        {
          success: false,
          message: "schemeId is required either in request body or as query parameter",
        },
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

