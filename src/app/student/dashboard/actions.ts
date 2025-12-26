"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { validateRequestOrigin } from "@/utils/security";
import { CreateApplicationSchema, UpdateApplicationSchema, UploadAttachmentSchema } from "@/utils/schemas";
import { z } from "zod";
import { Logger } from "@/utils/logger";

export async function addApplication(formData: FormData) {
    const logger = await Logger.init();
    const supabase = await createClient();

    if (!await validateRequestOrigin()) {
        await logger.warn({ action_type: "SECURITY_IsInvalidOrigin", resource: "application", message: "Invalid Request Origin" });
        return { error: "Invalid Request Origin" };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        await logger.warn({ action_type: "SECURITY_UNAUTHORIZED", resource: "application", message: "User not authenticated" });
        throw new Error("Unauthorized");
    }

    const rawData = {
        company: formData.get("company"),
        position: formData.get("position"),
        application_date: formData.get("application_date") || null,
        source: formData.get("source"),
    };

    const validated = CreateApplicationSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.issues[0]?.message || "Validation Error" };
    }
    const { company, position, application_date, source } = validated.data;

    const { error, data: newApp } = await supabase.from("applications").insert({
        student_id: user.id,
        company,
        position,
        application_date: application_date || null,
        source,
        status: "応募中",
    }).select().single();

    if (error) {
        await logger.error({
            action_type: "APPLICATION_CREATE_ERROR",
            resource: "application",
            error: error,
            input_params: { company, position, application_date, source }
        });
        return { error: error.message };
    }

    await logger.info({
        action_type: "APPLICATION_CREATE",
        resource: "application",
        message: "新規応募を作成しました",
        details: { applicationId: newApp.id, company, position }
    });

    revalidatePath("/student/dashboard");
    return { success: true };
}

export async function updateApplication(id: string, formData: FormData) {
    const logger = await Logger.init();
    const supabase = await createClient();

    if (!await validateRequestOrigin()) {
        return { error: "Invalid Request Origin" };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        company: formData.get("company"),
        position: formData.get("position"),
        application_date: formData.get("application_date") || null,
        source: formData.get("source"),
        status: formData.get("status"),
        document_result: formData.get("document_result") || "",
        resume_created: formData.get("resume_created") === "on",
        work_history_created: formData.get("work_history_created") === "on",
        portfolio_submitted: formData.get("portfolio_submitted") === "on",
    };

    const validated = UpdateApplicationSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.issues[0]?.message || "Validation Error" };
    }

    // 更新前のデータを取得（ログのDiff用）
    const { data: oldData } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .eq("student_id", user.id)
        .single();

    const {
        company, position, application_date, source, status, document_result,
        resume_created, work_history_created, portfolio_submitted
    } = validated.data;

    // DB更新
    const { error } = await supabase
        .from("applications")
        .update({
            company,
            position,
            application_date: application_date || null,
            source,
            status,
            document_result,
            // チェックボックスの状態はここでは更新しない（UI側でdisabled/管理対象外のため、または別ロジック？）
            // 元のコードでは update にこれらを含めていないため、ここでも除外して正しいか確認が必要ですが、
            // 元コードの update({ company... document_result }) に従います。
        })
        .eq("id", id)
        .eq("student_id", user.id);

    if (error) {
        await logger.error({
            action_type: "APPLICATION_UPDATE_ERROR",
            resource: "application",
            error: error,
            details: { id }
        });
        return { error: error.message };
    }

    await logger.info({
        action_type: "APPLICATION_UPDATE",
        resource: "application",
        message: "応募情報を更新しました",
        old_value: oldData,
        new_value: validated.data, // 厳密にはDBに保存されたデータと少し異なる可能性（自動更新フィールド等）があるが、意図は伝わる
        details: { id, company }
    });

    revalidatePath("/student/dashboard");
    return { success: true };
}

export async function uploadAttachment(applicationId: string, formData: FormData) {
    const logger = await Logger.init();
    const supabase = await createClient();

    if (!await validateRequestOrigin()) {
        return { error: "Invalid Request Origin" };
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const file = formData.get("file") as File;
    const rawCategory = formData.get("category");

    const validated = UploadAttachmentSchema.safeParse({
        category: rawCategory,
    });

    if (!validated.success) {
        return { error: validated.error.issues[0]?.message || "Validation Error" };
    }

    const { category } = validated.data;

    // Server-side count verification (Security)
    const { count: currentFileCount, error: countError } = await supabase
        .from("application_attachments")
        .select("*", { count: "exact", head: true })
        .eq("application_id", applicationId);

    if (countError) {
        return { error: "件数確認中にエラーが発生しました" };
    }

    if ((currentFileCount || 0) >= 10) {
        return { error: "1つの応募につき最大10ファイルまでです" };
    }

    // Additional file validation
    if (!file) {
        return { error: "ファイルは必須です" };
    }
    if (file.size > 5 * 1024 * 1024) {
        return { error: "ファイルサイズは5MB以下にしてください" };
    }

    // Check if application belongs to user first to avoid wasted upload
    const { data: app } = await supabase.from('applications').select('id').eq('id', applicationId).eq('student_id', user.id).single();
    if (!app) {
        return { error: "応募データが見つかりません" };
    }

    // Generate safe storage path
    const ext = file.name.split('.').pop() || 'bin';
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${ext}`;
    const path = `${applicationId}/${category}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
        .from('application-attachments')
        .upload(path, file);

    if (uploadError) {
        await logger.error({
            action_type: "ATTACHMENT_UPLOAD_ERROR",
            resource: "storage",
            error: uploadError,
            details: { applicationId, category, fileName: file.name }
        });
        return { error: "アップロードに失敗しました" };
    }

    // 2. Insert into DB
    const { data: insertedData, error: dbError } = await supabase
        .from("application_attachments")
        .insert({
            application_id: applicationId,
            file_path: path,
            file_name: file.name, // Save original name for display
            category,
            file_size: file.size,
        })
        .select()
        .single();

    if (dbError) {
        // Rollback storage if possible, or leave it (orphan cleanup later)
        console.error("DB Insert Error:", dbError);
        return { error: "データベースへの保存に失敗しました" };
    }

    // 3. Update application status flag
    const statusUpdate: any = {};
    if (category === "resume") statusUpdate.resume_created = true;
    if (category === "cv") statusUpdate.work_history_created = true;
    if (category === "portfolio") statusUpdate.portfolio_submitted = true;

    if (Object.keys(statusUpdate).length > 0) {
        await supabase
            .from("applications")
            .update(statusUpdate)
            .eq("id", applicationId);
    }

    await logger.info({
        action_type: "ATTACHMENT_UPLOAD",
        resource: "application_attachment",
        message: "ファイルをアップロードしました",
        details: { applicationId, category, fileName: file.name, fileSize: file.size }
    });

    revalidatePath("/student/dashboard");
    return { success: true, data: insertedData };
}

export async function deleteAttachment(attachmentId: string) {
    const logger = await Logger.init();

    if (!z.string().uuid().safeParse(attachmentId).success) {
        return { error: "Invalid Attachment ID" };
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!await validateRequestOrigin()) throw new Error("Invalid Request Origin");

    if (!user) throw new Error("Unauthorized");

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
        .from('application_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

    if (fetchError || !attachment) {
        return { error: "ファイルが見つかりません" };
    }

    // 1. Remove from Storage
    const { error: storageError } = await supabase.storage
        .from('application-attachments')
        .remove([attachment.file_path]);

    if (storageError) {
        await logger.error({
            action_type: "ATTACHMENT_DELETE_ERROR",
            resource: "storage",
            error: storageError,
            details: { attachmentId, path: attachment.file_path }
        });
        return { error: "ファイルの削除に失敗しました" };
    }

    // 2. Remove from DB
    const { error: dbError } = await supabase
        .from('application_attachments')
        .delete()
        .eq('id', attachmentId);

    if (dbError) {
        return { error: "データの削除に失敗しました" };
    }

    // 3. Update application status flag if no files left for this category
    const { count } = await supabase
        .from('application_attachments')
        .select('*', { count: 'exact', head: true })
        .eq('application_id', attachment.application_id)
        .eq('category', attachment.category);

    if (count === 0) {
        const resetUpdate: any = {};
        if (attachment.category === "resume") resetUpdate.resume_created = false;
        if (attachment.category === "cv") resetUpdate.work_history_created = false;
        if (attachment.category === "portfolio") resetUpdate.portfolio_submitted = false;

        if (Object.keys(resetUpdate).length > 0) {
            await supabase
                .from("applications")
                .update(resetUpdate)
                .eq("id", attachment.application_id);
        }
    }

    await logger.info({
        action_type: "ATTACHMENT_DELETE",
        resource: "application_attachment",
        message: "ファイルを削除しました",
        details: {
            attachmentId,
            applicationId: attachment.application_id,
            fileName: attachment.file_name,
            category: attachment.category
        }
    });

    revalidatePath("/student/dashboard");
    return { success: true };
}
