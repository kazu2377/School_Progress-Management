import { createClient } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "signup" | "invite" | "recovery" | "email_change",
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
    
    console.error("Token verification error:", error);
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", "invalid-token");
    return NextResponse.redirect(redirectTo);
  }

  // If no token_hash, redirect to login with error
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "missing-token");
  return NextResponse.redirect(redirectTo);
}
