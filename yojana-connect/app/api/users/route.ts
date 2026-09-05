import { NextRequest, NextResponse } from "next/server";
import { resolveUser, updateUserProfile } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await resolveUser(req);
    const updated = await updateUserProfile(user.id, {
      age: body.age,
      state: body.state,
      occupation: body.occupation,
      language: body.language || "en",
    });

    return NextResponse.json({ success: true, data: updated }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create/update user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

