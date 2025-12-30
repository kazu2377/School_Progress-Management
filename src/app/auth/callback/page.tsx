"use client";

import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      console.log("Auth Callback: Starting...");
      const supabase = createClient();
      const next = searchParams.get("next") || "/";
      const code = searchParams.get("code");
      
      console.log("Params:", { next, code, hash: window.location.hash });

      // 1. PKCE Flow (Code Exchange)
      if (code) {
        console.log("Auth Callback: Handling PKCE code...");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("PKCE Error:", error);
          setError(error.message);
          return;
        }
        console.log("Auth Callback: PKCE Success, redirecting to", next);
        router.replace(next);
        return;
      }

      // 2. Implicit Flow (Hash Handling)
      console.log("Auth Callback: Checking session for Implicit Flow...");
      
      // Attempt manual hash parsing first if present (Robuster for some environments)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
         console.log("Auth Callback: Hash detected, attempting manual parsing...");
         const params = new URLSearchParams(hash.substring(1)); // remove #
         const accessToken = params.get("access_token");
         const refreshToken = params.get("refresh_token");

         if (accessToken && refreshToken) {
             const { error: setSessionError } = await supabase.auth.setSession({
                 access_token: accessToken,
                 refresh_token: refreshToken,
             });
             if (!setSessionError) {
                 console.log("Auth Callback: Manual session set success, redirecting...");
                 router.replace(next);
                 return;
             }
             console.error("Manual SetSession Error:", setSessionError);
         }
      }

      // Standard check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Session Check:", { session, error: sessionError });
      
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (session) {
        // Successful implicit login
        console.log("Auth Callback: Session found, redirecting to", next);
        router.replace(next);
        return;
      }

      // 3. Listen for auth state change (Fallback)
      console.log("Auth Callback: Waiting for auth state change...");
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth State Change:", event, session);
        if (event === "SIGNED_IN" && session) {
            router.replace(next);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    handleAuth();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
            <h3 className="font-bold">認証エラー</h3>
            <p>{error}</p>
            <button 
                onClick={() => router.push("/login")}
                className="mt-4 text-sm underline hover:text-red-800"
            >
                ログイン画面へ戻る
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
        <p className="mt-2 text-slate-500">認証中...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-2 text-slate-500">読み込み中...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
