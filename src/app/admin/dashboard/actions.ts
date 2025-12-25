"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/utils/logger";
import { validateRequestOrigin } from "@/utils/security";
import { UpdateStudentProfileSchema } from "@/utils/schemas";
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
