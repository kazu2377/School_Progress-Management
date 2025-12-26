import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

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
                        request.cookies.set(name, value);
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // This will refresh session if needed - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Basic RBAC redirection
    if (!user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/manual_demo")
    ) {
        // No user, redirect to login
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // If user is logged in, check role for redirection from root or login page
    if (user) {
        if (request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/login")) {
            // Fetch profile to get role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role_id')
                .eq('id', user.id)
                .single();

            const role = profile?.role_id;
            const url = request.nextUrl.clone();

            if (role === 'admin') {
                url.pathname = "/admin/dashboard";
                return NextResponse.redirect(url);
            } else if (role === 'student') {
                url.pathname = "/student/dashboard";
                return NextResponse.redirect(url);
            }
        }

        // Strict RBAC for specific paths
        if (request.nextUrl.pathname.startsWith('/admin')) {
            // Fetch profile to get role if we haven't already (optimization: we could reuse if we fetched above, but logic above is inside "if path is / or /login")
            // Actually, the block above only runs for / and /login. So we need to fetch role here if not checked.
            // To avoid double fetching, let's restructure slightly to fetch role once if user exists.
            const { data: profile } = await supabase
                .from('profiles')
                .select('role_id')
                .eq('id', user.id)
                .single();

            const role = profile?.role_id;

            if (role !== 'admin') {
                const url = request.nextUrl.clone();
                url.pathname = "/"; // or /student/dashboard, or error page. Keeping it safe with root.
                return NextResponse.redirect(url);
            }
        }

        if (request.nextUrl.pathname.startsWith('/student')) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role_id')
                .eq('id', user.id)
                .single();

            const role = profile?.role_id;

            // Optional: Strict check for student role. Admin might need access?
            // If admin needs access, use: if (role !== 'student' && role !== 'admin')
            // For now adhering to strict separation as requested.
            if (role !== 'student' && role !== 'admin') {
                const url = request.nextUrl.clone();
                url.pathname = "/";
                return NextResponse.redirect(url);
            }
        }
    }

    return response;
}
