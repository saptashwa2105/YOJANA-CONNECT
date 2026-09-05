import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password, confirmPassword } = body;

    // Field validations
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter your full legal name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    // SIMULATED BACKEND DELAY & REGISTRATION
    // Replace this with your actual database/backend auth proxy call.
    await new Promise((resolve) => setTimeout(resolve, 700));

    const user = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
    };

    const mockToken = `jwt_mock_${Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 })).toString("base64")}`;

    const response = NextResponse.json({
      success: true,
      token: mockToken,
      user,
      message: "Registration successful",
    });

    response.cookies.set("auth_token", mockToken, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error occurred while registering user." },
      { status: 500 }
    );
  }
}

