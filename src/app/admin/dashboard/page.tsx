import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LogOut, UserPlus } from "lucide-react";
import AdminSearchFilter from "@/components/AdminSearchFilter";
import StudentEditModal from "@/components/StudentEditModal";

export default async function AdminDashboard({
    searchParams,
}: {
    searchParams: Promise<{ course_id?: string; month?: string; tab?: string; q?: string; status?: string; result?: string }>;
}) {
    const params = await searchParams;
    const currentTab = params.tab || "students";
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Verify admin role (Defense in Depth)
    const { data: profile } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", user.id)
        .single();

    if (profile?.role_id !== "admin") {
        return redirect("/");
    }

    // Fetch courses for the filter and modals
    const { data: courses } = await supabase.from("courses").select("*");

    // 1. Fetch Students (for KPI and for the students tab)
    let studentsQuery = supabase
        .from("students")
        .select(`
            *,
            profiles (full_name),
            courses (name),
            applications (*)
        `);

    if (params.course_id) {
        studentsQuery = studentsQuery.eq("course_id", params.course_id);
    }
    if (params.month) {
        studentsQuery = studentsQuery.gte("graduation_date", `${params.month}-01`).lte("graduation_date", `${params.month}-31`);
    }
    // Simple filter for students tab (keyword only on name)
    if (params.q) {
        // We need to use inner join for filtering profile fields
        studentsQuery = studentsQuery.ilike("profiles.full_name", `%${params.q}%`);
    }

    const { data: students } = await studentsQuery;

    // 2. Fetch All Applications (for the applications tab)
    let appsQuery = supabase
        .from("applications")
        .select(`
            *,
            students!inner (
                student_id,
                graduation_date,
                course_id,
                courses (name),
                profiles (full_name)
            ),
            application_attachments (*)
        `);

    if (params.course_id) {
        appsQuery = appsQuery.eq("students.course_id", params.course_id);
    }
    if (params.month) {
        appsQuery = appsQuery.gte("students.graduation_date", `${params.month}-01`).lte("students.graduation_date", `${params.month}-31`);
    }
    if (params.status) {
        appsQuery = appsQuery.eq("status", params.status);
    }
    if (params.result) {
        appsQuery = appsQuery.eq("document_result", params.result);
    }

    appsQuery = appsQuery.order('created_at', { ascending: false });

    const { data: rawApplications } = await appsQuery;

    // Filter by keyword in memory for more flexibility (cross-table OR)
    let filteredApps = rawApplications || [];
    if (params.q) {
        const q = params.q.toLowerCase();
        filteredApps = filteredApps.filter((app: any) => {
            const studentName = app.students?.profiles?.full_name?.toLowerCase() || "";
            const company = app.company?.toLowerCase() || "";
            const position = app.position?.toLowerCase() || "";
            const attachments = app.application_attachments?.some((a: any) => a.file_name.toLowerCase().includes(q)) || false;

            return studentName.includes(q) || company.includes(q) || position.includes(q) || attachments;
        });
    }

    // Generate signed URLs for attachments
    const allApplications = await Promise.all(filteredApps.map(async (app: any) => {
        const attachments = app.application_attachments || [];
        const attachmentsWithUrls = await Promise.all(attachments.map(async (file: any) => {
            const { data } = await supabase.storage.from('application-attachments').createSignedUrl(file.file_path, 3600);
            return { ...file, signedUrl: data?.signedUrl };
        }));
        return { ...app, application_attachments: attachmentsWithUrls };
    }));

    // KPI Calculations (Based on filtered applications)
    const totalApplications = filteredApps.length;
    const passedDocs = filteredApps.filter((a: any) => a.document_result === '通過').length;
    const totalOffers = filteredApps.filter((a: any) => a.status === '内定').length;

    const docRate = totalApplications > 0 ? Math.round((passedDocs / totalApplications) * 100) : 0;
    const offerRate = totalApplications > 0 ? Math.round((totalOffers / totalApplications) * 100) : 0;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <header className="bg-primary rounded-2xl shadow-lg p-8 mb-8 flex flex-wrap justify-between items-center gap-5">
                <h1 className="text-white text-2xl font-bold tracking-tight">就職支援管理システム</h1>
                <div className="flex gap-3">
                    <form action={async () => {
                        "use server";
                        const supabase = await createClient();
                        await supabase.auth.signOut();
                        redirect("/login");
                    }}>
                        <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/20 text-white rounded-md hover:bg-white/10 transition-colors">
                            <LogOut size={16} />
                            ログアウト
                        </button>
                    </form>
                </div>
                <div className="w-full flex gap-3 items-center">
                    <AdminSearchFilter courses={courses || []} />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2">総応募数</h3>
                    <div className="text-4xl font-extrabold text-primary my-2">{totalApplications}</div>
                    <div className="text-sm text-muted">検索条件の合計</div>
                </div>
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2">書類通過率</h3>
                    <div className="text-4xl font-extrabold text-primary my-2">{docRate}%</div>
                    <div className="text-sm text-muted">対象データの平均</div>
                </div>
                <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
                    <h3 className="text-muted text-sm font-semibold uppercase tracking-wider mb-2">内定率</h3>
                    <div className="text-4xl font-extrabold text-primary my-2">{offerRate}%</div>
                    <div className="text-sm text-muted">目標: <span className="text-primary font-semibold">60%</span></div>
                </div>
            </div>

            <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-white flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                        <a
                            href={`/admin/dashboard?tab=students&${new URLSearchParams(Object.entries(params).filter(([k, v]) => k !== 'tab' && v).map(([k, v]) => [k, v as string])).toString()}`}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTab === 'students' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'}`}
                        >
                            受講生一覧
                        </a>
                        <a
                            href={`/admin/dashboard?tab=applications&${new URLSearchParams(Object.entries(params).filter(([k, v]) => k !== 'tab' && v).map(([k, v]) => [k, v as string])).toString()}`}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${currentTab === 'applications' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'}`}
                        >
                            応募企業一覧
                        </a>
                    </div>
                    {currentTab === 'students' && (
                        <button className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-light flex items-center gap-2 transition-transform hover:-translate-y-px">
                            <UserPlus size={18} />
                            新規登録
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {currentTab === 'students' ? (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-border">
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">受講生ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">氏名</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">コース名</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">応募数</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">書類率</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">内定率</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {students?.map((s: any) => {
                                    const apps = s.applications || [];
                                    const dPass = apps.filter((a: any) => a.document_result === '通過').length;
                                    const sOff = apps.filter((a: any) => a.status === '内定').length;

                                    const sDocR = apps.length > 0 ? Math.round((dPass / apps.length) * 100) : 0;
                                    const sOffR = apps.length > 0 ? Math.round((sOff / apps.length) * 100) : 0;

                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium">{s.student_id}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-primary">{s.profiles?.full_name}</td>
                                            <td className="px-6 py-4 text-sm text-muted">{(s as any).courses?.name}</td>
                                            <td className="px-6 py-4 text-sm">{apps.length}社</td>
                                            <td className="px-6 py-4 text-sm">{sDocR}%</td>
                                            <td className="px-6 py-4 text-sm font-bold text-accent">{sOffR}%</td>
                                            <td className="px-6 py-4 text-sm">
                                                <StudentEditModal student={s} courses={courses || []} />
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!students || students.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted">
                                            該当する受講生がいません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-border">
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">受講生</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">コース</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">企業名</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">応募職種</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">ステータス</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">結果</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">提出書類</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allApplications?.map((app: any) => (
                                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-primary">{app.students?.profiles?.full_name}</td>
                                        <td className="px-6 py-4 text-sm text-muted">{app.students?.courses?.name}</td>
                                        <td className="px-6 py-4 text-sm font-bold">{app.company}</td>
                                        <td className="px-6 py-4 text-sm">{app.position}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${app.status === '選考中' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`font-bold ${app.document_result === '通過' ? 'text-green-600' : app.document_result === '不通過' ? 'text-rose-500' : 'text-muted'}`}>
                                                {app.document_result || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {app.application_attachments?.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {app.application_attachments.map((file: any) => (
                                                        <a
                                                            key={file.id}
                                                            href={file.signedUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-primary-light hover:text-white px-2 py-1 rounded text-xs transition-colors"
                                                            title={file.file_name}
                                                        >
                                                            <span className="max-w-[100px] truncate">{file.file_name}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted text-xs">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!allApplications || allApplications.length === 0) && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted">
                                            該当する応募データがありません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
