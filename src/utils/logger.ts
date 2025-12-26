import { createClient } from "@/utils/supabase/server";

/**
 * メールアドレスをマスクします (例: user@example.com -> u***@example.com)
 */
function maskEmail(email: string): string {
    if (!email || !email.includes("@")) return email;
    const [local, domain] = email.split("@");
    if (local.length <= 1) return `*@${domain}`;
    return `${local[0]}***@${domain}`;
}

/**
 * ログの詳細情報をサニタイズ（PIIの削除など）します
 */
function sanitizeDetails(details: any): any {
    if (!details) return details;
    const sanitized = { ...details };

    // email フィールドがあればマスク
    if (sanitized.email) {
        sanitized.email = maskEmail(sanitized.email);
    }

    // パスワードなどの機密情報が含まれていれば削除
    delete sanitized.password;
    delete sanitized.token;

    return sanitized;
}

/**
 * ログイン済みユーザーのアクティビティをログに記録します
 */
export async function logActivity(action: string, details?: any) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // ユーザーがいない場合は匿名用関数にフォールバック
            return logActivityAnonymous(action, details);
        }

        const { error } = await supabase.from("activity_logs").insert({
            user_id: user.id,
            action,
            details: sanitizeDetails(details),
        });

        if (error) console.error("Failed to write activity log:", error);
    } catch (err) {
        console.error("Error in logActivity:", err);
    }
}

/**
 * 未ログイン状態（匿名）でのアクティビティをログに記録します
 */
export async function logActivityAnonymous(action: string, details?: any) {
    try {
        const supabase = await createClient();

        const { error } = await supabase.from("activity_logs").insert({
            user_id: null,
            action,
            details: sanitizeDetails(details),
        });

        if (error) console.error("Failed to write anonymous activity log:", error);
    } catch (err) {
        console.error("Error in logActivityAnonymous:", err);
    }
}
