import { createClient } from "@/utils/supabase/server";
import { login } from "./actions";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string; error: string; mode?: string }>;
}) {
    const params = await searchParams;
    const isSignup = params.mode === "signup";
    const supabase = await createClient();
    const { data: courses } = await supabase.from("courses").select("*");

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-2xl dark:bg-slate-900">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        就職支援管理
                    </h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                        おかえりなさい！ログインしてください
                    </p>
                </div>


                <form className="space-y-5">
                    <div className="space-y-3">

                        <div className="space-y-1">
                            <label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase ml-1">
                                メールアドレス
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-lg border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm px-3"
                                placeholder="your@email.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase ml-1">
                                パスワード
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isSignup ? "new-password" : "current-password"}
                                required
                                className="block w-full rounded-lg border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm px-3"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {params?.error && (
                        <div className="rounded-lg bg-red-50 p-4 text-xs font-medium text-red-700 border border-red-100">
                            {params.error}
                        </div>
                    )}
                    {params?.message && (
                        <div className="rounded-lg bg-emerald-50 p-4 text-xs font-medium text-emerald-700 border border-emerald-100">
                            {params.message}
                        </div>
                    )}

                    <div className="pt-2">
                            <button
                                formAction={login}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                ログイン
                            </button>
                    </div>
                </form>

                <div className="space-y-4 pt-2">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">お困りですか？</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <a
                            href="/manual_demo/index.html"
                            target="_blank"
                            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                            <span>使い方マニュアル・ヘルプ</span>
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

