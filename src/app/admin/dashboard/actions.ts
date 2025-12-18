"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStudentProfile(studentId: string, formData: FormData) {
    const supabase = await createClient();

    const fullName = formData.get("full_name") as string;
    const courseId = formData.get("course_id") as string;
    const graduation_date = formData.get("graduation_date") as string;

    // Update profile (full_name)
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", studentId);

    if (profileError) return { error: profileError.message };

    // Update student entry (course_id)
    const { error: studentError } = await supabase
        .from("students")
        .update({
            course_id: courseId,
            graduation_date: graduation_date || null
        })
        .eq("id", studentId);

    if (studentError) return { error: studentError.message };

    revalidatePath("/admin/dashboard");
    return { success: true };
}

export async function deleteStudent(studentId: string) {
    const supabase = await createClient();

    // Supabase Table has ON DELETE CASCADE (mostly), 
    // but we also want to delete the auth.user if possible (requires admin API/Service Role).
    // For now, we delete from public.profiles, which should cascade to students/apps.
    const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", studentId);

    if (error) return { error: error.message };

    revalidatePath("/admin/dashboard");
    return { success: true };
}
