"use client";

import { useState } from "react";
import { X, Trash2, Save } from "lucide-react";
import { updateStudentProfile, deleteStudent } from "@/app/admin/dashboard/actions";

export default function StudentEditModal({ student, courses }: { student: any, courses: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        const result = await updateStudentProfile(student.id, formData);
        setIsPending(false);
        if (result.success) {
            setIsOpen(false);
        } else {
            alert("更新エラー: " + result.error);
        }
    };

    const handleDelete = async () => {
        if (!confirm("本当に削除しますか？関連する応募データもすべて削除されます。")) return;
        setIsPending(true);
        const result = await deleteStudent(student.id);
        setIsPending(false);
        if (result.success) {
            setIsOpen(false);
        } else {
            alert("削除エラー: " + result.error);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="border border-border bg-white hover:bg-primary hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
                詳細
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-primary">受講生プロファイルの編集</h2>
                            <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">受講生ID (閲覧のみ)</label>
                                <input disabled value={student.student_id} className="w-full px-3 py-2 border border-border rounded-lg bg-slate-50 text-muted" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">氏名</label>
                                <input
                                    name="full_name"
                                    type="text"
                                    required
                                    defaultValue={student.profiles?.full_name}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">コース名</label>
                                <select
                                    name="course_id"
                                    required
                                    defaultValue={student.course_id}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white font-sans"
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">修了月</label>
                                <input
                                    name="graduation_date"
                                    type="date"
                                    defaultValue={student.graduation_date}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>

                            <div className="pt-6 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {isPending ? "保存中..." : "変更を保存"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="w-full px-4 py-2 bg-transparent text-rose-600 rounded-lg font-semibold hover:bg-rose-50 flex items-center justify-center gap-2 transition-colors border border-rose-100 disabled:opacity-50"
                                >
                                    <Trash2 size={18} />
                                    受講生を削除
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
