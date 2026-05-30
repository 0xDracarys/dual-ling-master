export const dynamic = 'force-dynamic';
import { type NextRequest } from "next/server";
import { AuthService } from "@/lib/services/auth/auth.service";
import { traceLogger } from "@/lib/tracing/trace-logger";
import { z } from "zod";

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin
export const dynamic = 'force-dynamic';

// Validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["student", "teacher"]).optional(),
  language: z.enum(["en", "lt"]).optional(),
});

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/auth/register');

  try {
    traceLogger.log('info', 'API', 'Registration request received');

    const body = await request.json();
    traceLogger.log('debug', 'API', 'Request body parsed', {
      hasEmail: !!body.email,
      hasPassword: !!body.password,
      hasName: !!body.name,
      role: body.role
    });

    // Validate input
    traceLogger.log('info', 'API', 'Validating input data');
    const validatedData = registerSchema.parse(body);
    traceLogger.log('success', 'API', 'Input validation passed');

    // Use AuthService to register user
    const authService = new AuthService();
    const userProfile = await authService.registerUser(validatedData);

    traceLogger.log('success', 'API', 'User registered successfully', { uid: userProfile.uid });
    traceLogger.endSpan(spanId, 'success');

    return Response.json(
      {
        success: true,
        message: "User registered successfully. Please check your email for verification.",
        user: userProfile,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle validation errors
    if (error.name === "ZodError") {
      traceLogger.log('warn', 'API', 'Validation error', {
        errors: error.errors,
        receivedFields: Object.keys(error.errors || {})
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
    traceLogger.log('error', 'API', 'Registration failed', {
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
        error: error.message || "Registration failed",
      },
      { status: 400 }
    );
  }
}
