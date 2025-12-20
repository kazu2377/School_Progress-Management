import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import AddApplicationModal from "@/components/AddApplicationModal";
import SearchableApplicationList from "@/components/SearchableApplicationList";

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
            applications (
                *,
                application_attachments (*)
            )
        `)
        .eq("id", user.id)
        .single();

    if (error || !student) {
        console.error("Student data fetch error:", error);
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-primary">受講生データの読み取りエラー</h1>
                <p className="text-red-500 font-mono text-sm mb-4">{error?.message || "データが見つかりませんでした。"}</p>
                <div className="flex gap-4">
                    <form action={async () => {
                        "use server";
                        const supabase = await createClient();
                        await supabase.auth.signOut();
                        redirect("/login");
                    }}>
                        <button className="px-4 py-2 border border-border rounded-xl">ログインへ戻る</button>
                    </form>
                    <form action={async () => {
                        "use server";
                        const supabase = await createClient();
                        await supabase.from("students").insert({ id: user.id }).select().single();
                        revalidatePath("/student/dashboard");
                    }}>
                        <button className="px-4 py-2 bg-accent text-white rounded-xl">データを復旧して再試行</button>
                    </form>
                </div>
            </div>
        );
    }

    const applications = student.applications || [];
    const passed = applications.filter((a: any) => a.document_result === '通過').length;
    const pending = applications.filter((a: any) => !a.document_result || a.document_result === '審査中').length;
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
                        <p className="text-muted text-sm">{(student as any).courses?.name || 'コース未設定'}</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2 font-bold">応募社数</h3>
                    <div className="text-3xl font-extrabold text-primary my-2">{applications.length}<span className="text-lg font-normal text-muted ml-1">社</span></div>
                    <div className="text-sm text-muted">目標まであと <span className="font-semibold text-primary">{Math.max(0, 20 - applications.length)}</span> 社</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2 font-bold">書類通過率</h3>
                    <div className="text-3xl font-extrabold text-primary my-2">{passRate}<span className="text-lg font-normal text-muted ml-1">%</span></div>
                    <div className="text-sm text-muted">選考中: <span className="font-semibold text-primary">{pending}</span>社</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                        自分の応募履歴
                        <span className="text-sm font-normal text-muted ml-1">({applications.length}件)</span>
                    </h2>
                    <AddApplicationModal />
                </div>
                <SearchableApplicationList initialApplications={applications} />
            </div>
        </div>
    );
}
