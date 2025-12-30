"use server";

import { logActivity } from "@/utils/logger";
import { UpdateStudentProfileSchema } from "@/utils/schemas";
import { validateRequestOrigin } from "@/utils/security";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function updateStudentProfile(studentId: string, formData: FormData) {
    const supabase = await createClient();
    if (!await validateRequestOrigin()) {
        return { error: "Invalid Request Origin" };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .single();

    if (profile?.role_id !== "admin") {
        await logActivity("admin_unauthorized", { action: "updateStudentProfile", target_student_id: studentId });
        return { error: "Unauthorized" };
    }

    const rowData = {
        full_name: formData.get("full_name"),
        course_id: formData.get("course_id"),
        graduation_date: formData.get("graduation_date") || null,
    };

    const validated = UpdateStudentProfileSchema.safeParse(rowData);

    if (!validated.success) {
        return { error: validated.error.issues[0]?.message || "Validation Error" };
    }

    const { full_name, course_id, graduation_date } = validated.data;

    // Update profile (full_name)
    // Update profile (full_name)
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name })
        .eq("id", studentId);

    if (profileError) {
        await logActivity("admin_update_student_profile_failed", { target_student_id: studentId, error: profileError.message });
        return { error: profileError.message };
    }

    // Update student entry (course_id)
    const { error: studentError } = await supabase
        .from("students")
        .update({
            course_id: course_id,
            graduation_date: graduation_date || null
        })
        .eq("id", studentId);

    if (studentError) {
        await logActivity("admin_update_student_failed", { target_student_id: studentId, error: studentError.message });
        return { error: studentError.message };
    }

    await logActivity("admin_update_student_success", { target_student_id: studentId });
    revalidatePath("/admin/dashboard");
    return { success: true };
}

export async function deleteStudent(studentId: string) {
    if (!z.string().uuid().safeParse(studentId).success) {
        return { error: "Invalid Student ID" };
    }

    const supabase = await createClient();

    if (!await validateRequestOrigin()) {
        return { error: "Invalid Request Origin" };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .single();

    if (profile?.role_id !== "admin") {
        await logActivity("admin_unauthorized", { action: "deleteStudent", target_student_id: studentId });
        return { error: "Unauthorized" };
    }

    // Supabase Table has ON DELETE CASCADE (mostly), 
    // but we also want to delete the auth.user if possible (requires admin API/Service Role).
    // For now, we delete from public.profiles, which should cascade to students/apps.
    const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", studentId);

    if (error) {
        await logActivity("admin_delete_student_failed", { target_student_id: studentId, error: error.message });
        return { error: error.message };
    }

    await logActivity("admin_delete_student_success", { target_student_id: studentId });
    revalidatePath("/admin/dashboard");
    return { success: true };
}

/**
 * Invite User Action
 * Uses Service Role Key to bypass RLS and invite user via email.
 */

export async function inviteUser(formData: FormData) {
    const email = formData.get("email") as string;
    const fullName = formData.get("full_name") as string;
    const courseId = formData.get("course_id") as string;
    const roleId = formData.get("role_id") as string || "student"; 

    if (!email || !fullName || !courseId) {
        return { error: "必須項目が不足しています" };
    }

    // 2. Domain Restriction Check
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(",").map(d => d.trim()).filter(Boolean);
    if (allowedDomains && allowedDomains.length > 0) {
        const emailDomain = email.split("@")[1];
        if (!emailDomain || !allowedDomains.some(domain => emailDomain === domain || emailDomain.endsWith("." + domain))) {
            return { error: `許可されていないドメインです。(${allowedDomains.join(", ")}) のみ登録可能です。` };
        }
    }

    try {
        const supabaseAdmin = createAdminClient();
        
        // 1. Invite User by Email
        // This sends an email to the user with a magic link to set their password.
        // The user is created in auth.users immediately with 'invited' status.
        // NOTE: We do NOT pass redirectTo here. The Email Template controls the URL.
        // The template should point to /auth/confirm with token_hash, type, and next params.
        const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: fullName,
                course_id: courseId,
                role_id: roleId,
            },
            // redirectTo is omitted to let the email template control the flow
        });

        if (inviteError) {
            console.error("Invite Error:", inviteError);
            return { error: `招待エラー: ${translateAuthError(inviteError.message)}` };
        }

        // NOTE: We rely on Database Triggers (on auth.users insert) to create the Profile and Student records.
        // If your system manually creates them, add that logic here. 
        // Assuming 'handle_new_user' trigger uses 'raw_user_meta_data' to populate 'profiles' and 'students'.

        return { success: true };

    } catch (err: any) {
        console.error("Server Action Error:", err);
        return { error: "サーバーエラーが発生しました" };
    }
}



function translateAuthError(message: string): string {
    if (message.includes("email address has already been registered") || message.includes("email already registered")) {
        return "このメールアドレスは既に登録されています";
    }
    return message;
}
