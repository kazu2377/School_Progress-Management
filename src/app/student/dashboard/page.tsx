import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LogOut } from "lucide-react";
import AddApplicationModal from "@/components/AddApplicationModal";
import EditApplicationModal from "@/components/EditApplicationModal";

export default async function StudentDashboard() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Fetch student profile and applications
    const { data: student, error } = await supabase
        .from("students")
        .select(`
            *,
            profiles (full_name),
            courses (name),
            applications (*)
        `)
        .eq("id", user.id)
        .single();

    if (error || !student) {
        // ... (keep the error state for now to see if recursion is gone)
        console.error("Student data fetch error:", error);
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold">受講生データの読み込みエラー</h1>
                <p className="text-red-500 font-mono text-sm mb-4">{error?.message || "データが見つかりませんでした。"}</p>
                <p>User ID: {user.id}</p>
                <div className="flex gap-4 mt-6">
                    <form action={async () => {
                        "use server";
                        const supabase = await createClient();
                        await supabase.auth.signOut();
                        redirect("/login");
                    }}>
                        <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300">ログイン画面へ戻る</button>
                    </form>
                    <form action={async () => {
                        "use server";
                        const supabase = await createClient();
                        // データの自己修復を試みる（既存ユーザー用）
                        await supabase.from("students").insert({ id: user.id }).select().single();
                        revalidatePath("/student/dashboard");
                    }}>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">データを修復して再試行</button>
                    </form>
                </div>
            </div>
        );
    }

    const applications = student.applications || [];
    const passed = applications.filter((a: any) => a.document_result === '通過').length;
    // Cost: Pending is "document_result is null or '審査中'"
    const pending = applications.filter((a: any) => !a.document_result || a.document_result === '審査中').length;
    const offers = applications.filter((a: any) => a.has_job_offer).length;

    const passRate = applications.length > 0 ? Math.round((passed / applications.length) * 100) : 0;

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-xl">
                        {student.profiles?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">{student.profiles?.full_name}</h1>
                        <p className="text-muted text-sm">{(student as any).courses?.name}</p>
                    </div>
                </div>
                <form action={async () => {
                    "use server";
                    const supabase = await createClient();
                    await supabase.auth.signOut();
                    redirect("/login");
                }}>
                    <button className="text-muted hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-border">
                        ログアウト
                    </button>
                </form>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2">私の応募社数</h3>
                    <div className="text-3xl font-extrabold text-primary my-2">{applications.length}<span className="text-lg font-normal text-muted ml-1">社</span></div>
                    <div className="text-sm text-muted">目標: <span className="font-semibold text-primary">20社</span></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2">書類通過率</h3>
                    <div className="text-3xl font-extrabold text-primary my-2">{passRate}<span className="text-lg font-normal text-muted ml-1">%</span></div>
                    <div className="text-sm text-muted">選考中: <span className="font-semibold text-primary">{pending}</span>社</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2">内定数</h3>
                    <div className="text-3xl font-extrabold text-primary my-2">{offers}<span className="text-lg font-normal text-muted ml-1">件</span></div>
                    <div className="text-sm text-muted">ステータス: <span className="font-semibold text-accent">就職活動中</span></div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mb-8">
                <h2 className="text-lg font-bold text-primary mb-4">提出書類・準備状況</h2>
                <div className="space-y-4">
                    {/* Checkboxes - Need Client Component for interactivity, using static for SSR MVP or form actions */}
                    <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <input type="checkbox" className="w-5 h-5 text-accent rounded focus:ring-accent" />
                        <label className="text-primary font-medium">履歴書の作成・更新</label>
                    </div>
                    <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <input type="checkbox" className="w-5 h-5 text-accent rounded focus:ring-accent" />
                        <label className="text-primary font-medium">職務経歴書の作成・更新</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-5 h-5 text-accent rounded focus:ring-accent" />
                        <label className="text-primary font-medium">ポートフォリオの準備</label>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-bold text-primary">自分の応募履歴</h2>
                    <AddApplicationModal />
                </div>

                {applications.length === 0 ? (
                    <div className="p-10 text-center text-muted">応募履歴がありません</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-border">
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">応募日</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">企業名</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">ステータス</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">書類準備</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {applications.map((app: any) => (
                                    <tr key={app.id}>
                                        <td className="px-6 py-4 text-sm text-muted">{app.application_date || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-primary">{app.company}</div>
                                            <div className="text-xs text-muted">{app.position}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold 
                                        ${app.status === '書類通過' || app.status === '内定' ? 'bg-emerald-100 text-emerald-700' :
                                                    app.status === '不採用' || app.status === '書類不通過' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-slate-100 text-slate-600'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 text-xs">
                                                <span className={app.resume_created ? "text-emerald-500 font-bold" : "text-slate-300"}>✓履歴</span>
                                                <span className={app.work_history_created ? "text-emerald-500 font-bold" : "text-slate-300"}>✓職歴</span>
                                                <span className={app.portfolio_submitted ? "text-emerald-500 font-bold" : "text-slate-300"}>✓PF</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <EditApplicationModal application={app} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
