"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Logger } from "@/utils/logger";
import { LoginSchema, SignupSchema } from "@/utils/schemas";

export async function login(formData: FormData) {
    const logger = await Logger.init();

    const validated = LoginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validated.success) {
        redirect("/login?error=" + encodeURIComponent(validated.error.issues[0]?.message || "Login Error"));
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
            errorRedirectUrl = "/login?error=" + encodeURIComponent(error.message);
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
        errorRedirectUrl = "/login?error=Server error during login";
    }

    if (errorRedirectUrl) {
        redirect(errorRedirectUrl);
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    const logger = await Logger.init();

    const rawData = {
        email: formData.get("email"),
        password: formData.get("password"),
        full_name: formData.get("full_name"),
        course_id: formData.get("course_id"),
    };

    const validated = SignupSchema.safeParse(rawData);

    if (!validated.success) {
        const nextRedirectUrl = "/login?error=" + encodeURIComponent(validated.error.issues[0]?.message || "Signup Error");
        redirect(nextRedirectUrl);
    }

    const { email, password, full_name, course_id } = validated.data;

    let nextRedirectUrl = "";

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: full_name,
                    course_id: course_id,
                },
            },
        });

        if (error) {
            console.error("Signup failed:", error.message);
            // 注意: 未認証ユーザーはRLSによりactivity_logsへの書き込みが許可されていないため、ここではログを記録しない
            nextRedirectUrl = "/login?error=" + encodeURIComponent(error.message);
        } else {
            revalidatePath("/login");
            await logger.info({
                action_type: "SIGNUP_SUCCESS",
                resource: "auth",
                message: "新規登録を受け付けました",
                details: { email, full_name, course_id }
            });
            nextRedirectUrl = "/login?message=" + encodeURIComponent("新規登録を受け付けました。メールを確認して認証を完了してください。");
        }
    } catch (err: any) {
        console.error("Signup action error:", err);
        await logger.error({
            action_type: "SIGNUP_ERROR",
            resource: "auth",
            error: err
        });
        nextRedirectUrl = "/login?error=Server error during signup";
    }

    redirect(nextRedirectUrl);
}
