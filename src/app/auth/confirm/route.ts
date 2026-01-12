import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  // Use the host from request headers to ensure redirect matches cookie domain
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";

  // Build redirect URL using the actual request host (not the internal Docker host)
  const redirectUrl = new URL(`${protocol}://${host}${next}`);

  // Create redirect response first so we can set cookies on it
  let response = NextResponse.redirect(redirectUrl);

  if (token_hash && type) {
    // Create Supabase client that reads from request cookies and writes to response cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                path: "/",
              });
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "signup" | "invite" | "recovery" | "email_change",
    });

    if (!error) {
      return response;
    }

    console.error("Token verification error:", error);
    const errorRedirect = new URL(`${protocol}://${host}/login?error=invalid-token`);
    return NextResponse.redirect(errorRedirect);
  }

  // If no token_hash, redirect to login with error
  const errorRedirect = new URL(`${protocol}://${host}/login?error=missing-token`);
  return NextResponse.redirect(errorRedirect);
}
