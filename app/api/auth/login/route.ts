export const dynamic = 'force-dynamic';
import { type NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth/auth.service";
import { traceLogger } from "@/lib/tracing/trace-logger";
import { z } from "zod";

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/auth/login');

  try {
    traceLogger.log('info', 'API', 'Login request received');

    const body = await request.json();
    traceLogger.log('debug', 'API', 'Request body parsed', {
      hasEmail: !!body.email,
      hasPassword: !!body.password
    });

    // Validate input
    traceLogger.log('info', 'API', 'Validating input data');
    const { email, password } = loginSchema.parse(body);
    traceLogger.log('success', 'API', 'Input validation passed');

    // Use AuthService to login user
    const authService = new AuthService();
    const result = await authService.loginWithEmail(email, password);

    traceLogger.log('success', 'API', 'Login successful', { uid: result.userProfile.uid });
    traceLogger.endSpan(spanId, 'success');

    return Response.json(
      {
        success: true,
        message: "Login successful",
        user: result.userProfile,
        token: result.idToken, // Return Firebase ID token
        refreshToken: result.refreshToken,
        tokenExpiresAt: result.tokenExpiresAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Handle validation errors
    if (error.name === "ZodError") {
      traceLogger.log('warn', 'API', 'Validation error', {
        errors: error.errors
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Validation failed' });

      return Response.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Firebase errors
    traceLogger.log('error', 'API', 'Login failed', {
      error: error.message,
      code: error.code,
    });
    traceLogger.endSpan(spanId, 'error', {
      message: error.message,
      stack: error.code ? `Error code: ${error.code}` : undefined,
    });

    return Response.json(
      {
        success: false,
        error: error.message || "Login failed",
      },
      { status: 401 }
    );
  }
}
