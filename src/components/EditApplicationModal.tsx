"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, X, Upload, Trash2, FileText, File } from "lucide-react";
import { updateApplication, uploadAttachment, deleteAttachment } from "@/app/student/dashboard/actions";

export default function EditApplicationModal({ application }: { application: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
    // Initialize attachments state from props
    const [attachments, setAttachments] = useState<any[]>(application.application_attachments || []);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateApplication(application.id, formData);

        setIsPending(false);
        if (result?.success) {
            setIsOpen(false);
            router.refresh();
        } else if (result?.error) {
            alert("エラーが発生しました: " + result.error);
        }
    };

    const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData(e.currentTarget);

        // Client-side validation
        const file = formData.get("file") as File;
        if (file && file.size > 5 * 1024 * 1024) {
            alert("ファイルサイズは5MB以下にしてください");
            setUploading(false);
            return;
        }

        // append current count for validation
        const currentCount = application.application_attachments?.length || 0;
        formData.append('current_count', currentCount.toString());

        const result = await uploadAttachment(application.id, formData);

        setUploading(false);
        if (result?.error) {
            alert(result.error);
        } else {
            // Add new attachment to list
            if (result?.data) {
                setAttachments(prev => [result.data, ...prev]);
            }
            // Reset form
            (e.target as HTMLFormElement).reset();
            router.refresh();
        }
    };

    const handleDeleteFile = async (attachmentId: string) => {
        if (!confirm("このファイルを削除してもよろしいですか？")) return;

        const result = await deleteAttachment(attachmentId);
        if (result?.error) {
            alert(result.error);
        } else {
            // Remove from list
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
            router.refresh();
        }
    };

    // const attachments = application.application_attachments || []; // Removed derived variable
    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'resume': return '履歴書';
            case 'cv': return '職務経歴書';
            case 'portfolio': return 'ポートフォリオ';
            default: return cat;
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs border border-border bg-slate-50 px-2 py-1 rounded hover:bg-white hover:border-accent flex items-center gap-1"
            >
                <Edit2 size={12} />
                編集
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-primary">応募情報の編集</h2>
                            <button onClick={() => setIsOpen(false)} className="text-muted hover:text-primary transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex border-b border-border">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'details' ? 'text-primary border-b-2 border-primary bg-slate-50' : 'text-muted hover:bg-slate-50'}`}
                            >
                                基本情報
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'documents' ? 'text-primary border-b-2 border-primary bg-slate-50' : 'text-muted hover:bg-slate-50'}`}
                            >
                                提出書類 ({attachments.length})
                            </button>
                        </div>

                        {activeTab === 'details' ? (
                            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-semibold text-primary mb-1">企業名 *</label>
                                        <input
                                            name="company"
                                            type="text"
                                            required
                                            defaultValue={application.company}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-1">職種</label>
                                        <input
                                            name="position"
                                            type="text"
                                            defaultValue={application.position}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-1">応募日</label>
                                        <input
                                            name="application_date"
                                            type="date"
                                            defaultValue={application.application_date}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-1">応募経路</label>
                                        <select
                                            name="source"
                                            defaultValue={application.source}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white font-sans"
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
                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-1">ステータス</label>
                                        <select
                                            name="status"
                                            defaultValue={application.status}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white font-sans"
                                        >
                                            <option value="応募中">応募中</option>
                                            <option value="書類通過">書類通過</option>
                                            <option value="一次面接">一次面接</option>
                                            <option value="二次面接">二次面接</option>
                                            <option value="最終面接">最終面接</option>
                                            <option value="内定">内定</option>
                                            <option value="不採用">不採用</option>
                                            <option value="辞退">辞退</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-primary mb-1">書類結果</label>
                                        <select
                                            name="document_result"
                                            defaultValue={application.document_result || "審査中"}
                                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-white font-sans"
                                        >
                                            <option value="審査中">審査中</option>
                                            <option value="通過">通過</option>
                                            <option value="不通過">不通過</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-border space-y-3">
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] mb-2 flex items-center gap-1.5">
                                        <span className="w-1 h-3 bg-accent rounded-full"></span>
                                        書類準備状況 (自動更新)
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                        <label className="flex items-center gap-2 opacity-80 decoration-slate-300">
                                            <input type="checkbox" checked={application.resume_created} disabled className="w-4 h-4 rounded text-emerald-500 border-slate-300 bg-white" />
                                            <span className={`text-xs font-bold ${application.resume_created ? 'text-emerald-600' : 'text-slate-400'}`}>履歴書OK</span>
                                        </label>
                                        <label className="flex items-center gap-2 opacity-80">
                                            <input type="checkbox" checked={application.work_history_created} disabled className="w-4 h-4 rounded text-emerald-500 border-slate-300 bg-white" />
                                            <span className={`text-xs font-bold ${application.work_history_created ? 'text-emerald-600' : 'text-slate-400'}`}>職歴書OK</span>
                                        </label>
                                        <label className="flex items-center gap-2 opacity-80">
                                            <input type="checkbox" checked={application.portfolio_submitted} disabled className="w-4 h-4 rounded text-emerald-500 border-slate-300 bg-white" />
                                            <span className={`text-xs font-bold ${application.portfolio_submitted ? 'text-emerald-600' : 'text-slate-400'}`}>PF提出OK</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
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
                                        {isPending ? "更新中..." : "変更を保存"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-6 space-y-6 overflow-y-auto flex-1 h-[400px]">
                                {/* File List */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                        <FileText size={16} />
                                        提出済み書類
                                    </h3>
                                    {attachments.length === 0 ? (
                                        <p className="text-sm text-muted bg-slate-50 p-4 rounded-lg text-center border border-dashed border-border">
                                            書類はまだ提出されていません
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {attachments.map((file: any) => (
                                                <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-border rounded-lg hover:border-accent/50 transition-colors shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`p-2 rounded-lg ${file.category === 'portfolio' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            <File size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate text-primary">{file.file_name}</p>
                                                            <div className="flex gap-2 text-xs text-muted">
                                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{getCategoryLabel(file.category)}</span>
                                                                <span>{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteFile(file.id)}
                                                        className="text-muted hover:text-red-500 p-2 transition-colors"
                                                        title="削除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Upload Form */}
                                <div className="space-y-3 pt-3 border-t border-border">
                                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                                        <Upload size={16} />
                                        新規アップロード
                                    </h3>
                                    <form onSubmit={handleFileUpload} className="bg-slate-50 p-4 rounded-xl border border-border space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-primary mb-1">書類種別</label>
                                            <select name="category" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white" required>
                                                <option value="resume">履歴書</option>
                                                <option value="cv">職務経歴書</option>
                                                <option value="portfolio">ポートフォリオ</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-primary mb-1">ファイル (最大5MB)</label>
                                            <input
                                                type="file"
                                                name="file"
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={uploading || attachments.length >= 10}
                                            className="w-full py-2 bg-accent text-white rounded-lg text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                                        >
                                            {uploading ? "アップロード中..." : (attachments.length >= 10 ? "アップロード上限です" : "アップロード")}
                                        </button>
                                        {attachments.length >= 10 && <p className="text-xs text-red-500 text-center">最大10ファイルまでです</p>}
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            )
            }
        </>
    );
}
