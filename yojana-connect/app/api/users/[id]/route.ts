import { NextRequest, NextResponse } from "next/server";
import { resolveUser, getProfileWithBookmarks, updateUserProfile } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    const profile = await getProfileWithBookmarks(user);
    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await req.json();
    const userId = Number(params.id);

    const updated = await updateUserProfile(isNaN(userId) ? 1 : userId, {
      age: body.age,
      state: body.state,
      occupation: body.occupation,
      language: body.language,
      annualIncome: body.annualIncome,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
