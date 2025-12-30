"use server";

import { Logger } from "@/utils/logger";
import { LoginSchema } from "@/utils/schemas";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Supabase/Authのエラーメッセージを日本語に変換するヘルパー関数
 */
function translateAuthError(message: string): string {
    if (message.includes("Invalid login credentials")) {
        return "メールアドレスまたはパスワードが正しくありません";
    }
    if (message.includes("User already registered")) {
        return "このメールアドレスは既に登録されています";
    }
    if (message.includes("Password should be at least")) {
        return "パスワードは6文字以上である必要があります";
    }
    if (message.includes("For security purposes, you can only request this once every")) {
        return "セキュリティのため、しばらく時間を置いてから再試行してください";
    }
    if (message.includes("Email not confirmed")) {
        return "メールアドレスが認証されていません。受信トレイを確認してください";
    }
    // その他のエラーはそのまま、または汎用的なメッセージを表示
    return `エラーが発生しました: ${message}`;
}

export async function login(formData: FormData) {
    const logger = await Logger.init();

    const validated = LoginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validated.success) {
        redirect("/login?error=" + encodeURIComponent(validated.error.issues[0]?.message || "ログインエラー"));
    }

    const { email, password } = validated.data;

    let errorRedirectUrl = "";

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login failed:", error.message);
            await logger.warn({
                action_type: "LOGIN_FAILED",
                resource: "auth",
                message: "ログインに失敗しました",
                details: { email, reason: error.message }
            });
            const japaneseError = translateAuthError(error.message);
            errorRedirectUrl = "/login?error=" + encodeURIComponent(japaneseError);
        } else {
            await logger.info({
                action_type: "LOGIN_SUCCESS",
                resource: "auth",
                message: "ログインに成功しました",
                details: { email }
            });
        }
    } catch (err: any) {
        console.error("Login action error:", err);
        await logger.error({
            action_type: "LOGIN_ERROR",
            resource: "auth",
            error: err,
        });
        errorRedirectUrl = "/login?error=" + encodeURIComponent("サーバーエラーが発生しました");
    }

    if (errorRedirectUrl) {
        redirect(errorRedirectUrl);
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    // Public signup is disabled.
    redirect("/login?error=" + encodeURIComponent("新規登録は招待制です。管理者にお問い合わせください。"));
}
