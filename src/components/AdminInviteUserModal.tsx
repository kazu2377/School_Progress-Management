"use client";

import { inviteUser } from "@/app/admin/dashboard/actions";
import { Loader2, Mail, Plus, X } from "lucide-react";
import { useState } from "react";

type Course = {
    id: string;
    name: string;
};

export default function AdminInviteUserModal({ courses }: { courses: Course[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setMessage(null);
        
        try {
            const result = await inviteUser(formData);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: "招待メールを送信しました" });
                // Reset form or close modal after delay if needed
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage(null);
                }, 2000);
            }
        } catch (e) {
            setMessage({ type: 'error', text: "予期せぬエラーが発生しました" });
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
            >
                <Plus size={16} />
                新規ユーザー招待
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Mail className="text-indigo-600" size={20} />
                        ユーザーを招待
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form action={handleSubmit} className="p-4 space-y-4">
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">メールアドレス</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            placeholder="user@example.com"
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="full_name" className="text-xs font-bold text-slate-500 uppercase">氏名</label>
                        <input
                            type="text"
                            name="full_name"
                            id="full_name"
                            required
                            placeholder="山田 太郎"
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="course_id" className="text-xs font-bold text-slate-500 uppercase">コース</label>
                        <select
                            name="course_id"
                            id="course_id"
                            required
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        >
                            <option value="">コースを選択</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                     <div className="space-y-1">
                        <label htmlFor="role_id" className="text-xs font-bold text-slate-500 uppercase">権限</label>
                        <select
                            name="role_id"
                            id="role_id"
                            required
                            defaultValue="student"
                            className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border bg-white"
                        >
                            <option value="student">受講生 (Student)</option>
                            <option value="admin">管理者 (Admin)</option>
                        </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            招待メールを送信
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
