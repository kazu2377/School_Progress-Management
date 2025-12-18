import { createClient } from "@/utils/supabase/server";
import { login, signup } from "./actions";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string; error: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: courses } = await supabase.from("courses").select("*");

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-xl dark:bg-slate-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        就職支援管理システム
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        ログインまたは新規登録してください
                    </p>
                </div>

                <form className="mt-8 space-y-6">
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="full_name" className="sr-only">
                                氏名
                            </label>
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="氏名 (新規登録時のみ)"
                            />
                        </div>
                        <div>
                            <label htmlFor="course_id" className="sr-only">
                                コース
                            </label>
                            <select
                                id="course_id"
                                name="course_id"
                                className="relative block w-full border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3 bg-white"
                            >
                                <option value="">コースを選択 (新規登録時のみ)</option>
                                {courses?.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                メールアドレス
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="メールアドレス"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                パスワード
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="パスワード"
                            />
                        </div>
                    </div>

                    {params?.error && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                            {params.error}
                        </div>
                    )}
                    {params?.message && (
                        <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">
                            {params.message}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            formAction={login}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            ログイン
                        </button>
                        <button
                            formAction={signup}
                            className="group relative flex w-full justify-center rounded-md bg-white border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            テスト用アカウント作成 (新規登録)
                        </button>
                        <p className="text-xs text-muted text-center pt-2">
                            ※新規登録時に「氏名」を入力してください。
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
