import { NextRequest, NextResponse } from "next/server";
import { resolveUser, getProfileWithBookmarks, updateUserProfile } from "@/lib/db";
import { parseAge, parseIncome } from "@/lib/schemes";

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    const profile = await getProfileWithBookmarks(user);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    const body = await req.json();

    const { age, state, occupation, language, annualIncome } = body;

    // Validate age
    let parsedAge: number | undefined = undefined;
    if (age !== undefined && age !== null && age !== "") {
      const numAge = parseAge(age);
      if (numAge === null || numAge < 0 || numAge > 120) {
        return NextResponse.json(
          {
            success: false,
            message: "Age must be a valid number between 0 and 120",
          },
          { status: 400 }
        );
      }
      parsedAge = numAge;
    }

    // Validate annualIncome
    let parsedIncome: number | null | undefined = undefined;
    if (annualIncome !== undefined && annualIncome !== null && annualIncome !== "") {
      const numIncome = parseIncome(annualIncome);
      if (numIncome === null || numIncome < 0) {
        return NextResponse.json(
          {
            success: false,
            message: "annualIncome must be a non-negative number",
          },
          { status: 400 }
        );
      }
      parsedIncome = numIncome;
    }

    const updated = await updateUserProfile(user.id, {
      age: parsedAge !== undefined ? parsedAge : user.age,
      state: state !== undefined ? state : user.state,
      occupation: occupation !== undefined ? occupation : user.occupation,
      language: language !== undefined ? language : user.language,
      annualIncome: parsedIncome !== undefined ? parsedIncome : user.annualIncome,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}

