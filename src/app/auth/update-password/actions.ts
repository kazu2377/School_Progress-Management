"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const PasswordSchema = z.object({
  password: z.string().min(6, "パスワードは6文字以上で入力してください"),
  confirmPassword: z.string().min(6, "確認用パスワードは6文字以上で入力してください"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  
  const validated = PasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { password } = validated.data;

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Password update error:", error);
    return { error: "パスワードの更新に失敗しました" };
  }

  redirect("/");
}
