"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addApplication } from "@/app/student/dashboard/actions";
import { useRouter } from "next/navigation";

export default function AddApplicationModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);

        const formData = new FormData(e.currentTarget);
        const result = await addApplication(formData);

        setIsPending(false);
        if (result?.success) {
            setIsOpen(false);
            // router.refresh() or revalidatePath handles data update
        } else if (result?.error) {
            alert("エラーが発生しました: " + result.error);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-light flex items-center gap-2 transition-transform hover:-translate-y-px text-sm"
            >
                <Plus size={16} />
                応募を追加
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-primary">新規応募の追加</h2>
                            <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">企業名 *</label>
                                <input
                                    name="company"
                                    type="text"
                                    required
                                    placeholder="例: 株式会社サンプル"
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">職種</label>
                                <input
                                    name="position"
                                    type="text"
                                    placeholder="例: フロントエンドエンジニア"
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">応募日</label>
                                <input
                                    name="application_date"
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-1">応募経路</label>
                                <select
                                    name="source"
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white"
                                >
                                    <option value="ハローワーク">ハローワーク</option>
                                    <option value="リクナビNEXT">リクナビNEXT</option>
                                    <option value="Wantedly">Wantedly</option>
                                    <option value="Green">Green</option>
                                    <option value="学校紹介">学校紹介</option>
                                    <option value="自己開拓">自己開拓</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg font-semibold text-muted hover:bg-slate-50 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
                                >
                                    {isPending ? "保存中..." : "保存する"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
