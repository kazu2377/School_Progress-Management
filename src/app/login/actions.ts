"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logActivity } from "@/utils/logger";

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    let errorRedirectUrl = "";

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login failed:", error.message);
            errorRedirectUrl = "/login?error=" + encodeURIComponent(error.message);
        } else {
            await logActivity("login_success", { email });
        }
    } catch (err: any) {
        console.error("Login action error:", err);
        errorRedirectUrl = "/login?error=Server error during login";
    }

    if (errorRedirectUrl) {
        redirect(errorRedirectUrl);
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;
    const courseId = formData.get("course_id") as string;

    if (!fullName || !courseId) {
        redirect("/login?error=" + encodeURIComponent("氏名とコースを選択してください。"));
    }

    let nextRedirectUrl = "";

    try {
        const supabase = await createClient();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    course_id: courseId,
                },
            },
        });

        if (error) {
            console.error("Signup failed:", error.message);
            nextRedirectUrl = "/login?error=" + encodeURIComponent(error.message);
        } else {
            revalidatePath("/login");
            nextRedirectUrl = "/login?message=" + encodeURIComponent("新規登録を受け付けました。メールを確認して認証を完了してください。");
        }
    } catch (err: any) {
        console.error("Signup action error:", err);
        nextRedirectUrl = "/login?error=Server error during signup";
    }

    redirect(nextRedirectUrl);
}
