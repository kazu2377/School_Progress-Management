import { z } from "zod";

// --- Enums ---
export const ApplicationStatusEnum = z.enum([
    "応募前",
    "応募中",
    "書類選考中",
    "面接中",
    "内定",
    "不採用",
    "辞退",
]);

export const DocumentResultEnum = z.enum(["通過", "不合格", "待ち", ""]);

export const AttachmentCategoryEnum = z.enum(["resume", "cv", "portfolio", "other"]);

// --- Auth Schemas ---
export const LoginSchema = z.object({
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: z.string().min(1, "パスワードを入力してください"),
});

export const SignupSchema = z.object({
    email: z.string().email("有効なメールアドレスを入力してください"),
    password: z.string().min(6, "パスワードは6文字以上で入力してください"),
    full_name: z.string().min(1, "氏名を入力してください"),
    course_id: z.string().min(1, "コースを選択してください"),
});

// --- Admin Schemas ---
export const UpdateStudentProfileSchema = z.object({
    full_name: z.string().min(1, "氏名を入力してください").max(100, "氏名は100文字以内で入力してください"),
    course_id: z.string().min(1, "コースを選択してください").max(50, "不正なコースIDです"),
    graduation_date: z.string().optional().nullable(),
});

// --- Student App Schemas ---
export const CreateApplicationSchema = z.object({
    company: z.string().min(1, "企業名を入力してください"),
    position: z.string().min(1, "職種を入力してください"),
    source: z.string().optional(),
    application_date: z.string().optional().nullable(),
});

export const UpdateApplicationSchema = CreateApplicationSchema.extend({
    status: ApplicationStatusEnum.optional(),
    document_result: DocumentResultEnum.optional(),
    // Checkboxes come as "on" or null/undefined usually in FormData, handling boolean conversion in action or here via coerce/preprocess
    // Ideally validated after conversion.
    resume_created: z.boolean().optional(),
    work_history_created: z.boolean().optional(),
    portfolio_submitted: z.boolean().optional(),
});

export const UploadAttachmentSchema = z.object({
    category: AttachmentCategoryEnum,
    current_count: z.number().max(10),
});
