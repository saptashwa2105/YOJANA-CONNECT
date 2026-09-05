import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailOrUsername, password, rememberMe } = body;

    // Field validations
    if (!emailOrUsername || typeof emailOrUsername !== "string" || !emailOrUsername.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide your email address or username." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // SIMULATED BACKEND DELAY & CREDENTIAL VALIDATION
    // Replace this with your actual database/backend auth proxy call.
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Demo invalid credentials check example (optional test trigger)
    if (password === "wrongpassword") {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your password." },
        { status: 401 }
      );
    }

    // Mock generated user and session token
    const user = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: emailOrUsername.includes("@")
        ? emailOrUsername.split("@")[0].replace(/[._]/g, " ")
        : emailOrUsername,
      email: emailOrUsername.includes("@")
        ? emailOrUsername
        : `${emailOrUsername}@citizen.gov.in`,
    };

    const mockToken = `jwt_mock_${Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 })).toString("base64")}`;

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

    const response = NextResponse.json({
      success: true,
      token: mockToken,
      user,
      message: "Authentication successful",
    });

    response.cookies.set("auth_token", mockToken, {
      path: "/",
      sameSite: "lax",
      maxAge,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error occurred while processing login." },
      { status: 500 }
    );
  }
}

