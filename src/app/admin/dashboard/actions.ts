"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/utils/logger";
import { validateRequestOrigin } from "@/utils/security";

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

    const fullName = formData.get("full_name") as string;
    const courseId = formData.get("course_id") as string;
    const graduation_date = formData.get("graduation_date") as string;

    // Update profile (full_name)
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", studentId);

    if (profileError) {
        await logActivity("admin_update_student_profile_failed", { target_student_id: studentId, error: profileError.message });
        return { error: profileError.message };
    }

    // Update student entry (course_id)
    const { error: studentError } = await supabase
        .from("students")
        .update({
            course_id: courseId,
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
