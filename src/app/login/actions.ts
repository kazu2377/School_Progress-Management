"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { logActivity } from "@/utils/logger";
import { LoginSchema, SignupSchema } from "@/utils/schemas";

export async function login(formData: FormData) {
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
