import { NextRequest, NextResponse } from "next/server";
import { loadSchemeDataset, filterSchemesDynamically } from "@/lib/schemes";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const occupation = url.searchParams.get("occupation");
    const state = url.searchParams.get("state");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search") || url.searchParams.get("q");

    const allSchemes = loadSchemeDataset();
    const filtered = filterSchemesDynamically(allSchemes, {
      occupation,
      state,
      category,
      search,
    });

    return NextResponse.json({
      success: true,
      filteredBy: {
        occupation: occupation || null,
        state: state || null,
        category: category || null,
        search: search || null,
      },
      count: filtered.length,
      data: filtered,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve schemes";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

