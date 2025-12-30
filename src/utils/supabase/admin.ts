import { createClient } from "@supabase/supabase-js";

/**
 * Service Role (Admin) を使用した Supabase クライアントを作成します。
 * RLS をバイパスするため、サーバーサイドでのみ安全に使用してください。
 * クライアントサイド（ブラウザ）にこのキーを漏洩させないでください。
 */
export const createAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase Admin environment variables (URL or Service Role Key)");
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
