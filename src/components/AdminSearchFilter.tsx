"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminSearchFilter({ courses }: { courses: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [q, setQ] = useState(searchParams.get("q") || "");
    const [courseId, setCourseId] = useState(searchParams.get("course_id") || "");
    const [month, setMonth] = useState(searchParams.get("month") || "");
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [result, setResult] = useState(searchParams.get("result") || "");

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (q) params.set("q", q); else params.delete("q");
        if (courseId) params.set("course_id", courseId); else params.delete("course_id");
        if (month) params.set("month", month); else params.delete("month");
        if (status) params.set("status", status); else params.delete("status");
        if (result) params.set("result", result); else params.delete("result");

        router.push(`/admin/dashboard?${params.toString()}`);
    };

    const handleReset = () => {
        const tab = searchParams.get("tab") || "students";
        router.push(`/admin/dashboard?tab=${tab}`);
        setQ("");
        setCourseId("");
        setMonth("");
        setStatus("");
        setResult("");
    };

    return (
        <div className="flex flex-wrap gap-3 items-center w-full">
            <div className="flex-1 min-w-[200px]">
                <input
                    type="text"
                    placeholder="受講生、企業、職種、書類名で検索..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
            </div>
            <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
            >
                <option value="">すべてのコース</option>
                {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
            >
                <option value="">すべてのステータス</option>
                <option value="応募中">応募中</option>
                <option value="選考中">選考中</option>
                <option value="内定">内定</option>
                <option value="辞退・終了">辞退・終了</option>
            </select>
            <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
            >
                <option value="">すべての結果</option>
                <option value="通過">書類通過</option>
                <option value="お見送り">お見送り</option>
                <option value="審査中">審査中</option>
            </select>
            <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
            />
            <div className="flex gap-2">
                <button
                    onClick={handleSearch}
                    className="bg-accent text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-accent-hover transition-transform hover:-translate-y-px shadow-sm whitespace-nowrap"
                >
                    検索
                </button>
                <button
                    onClick={handleReset}
                    className="bg-white/10 text-white/70 px-4 py-2.5 rounded-xl font-medium hover:bg-white/20 hover:text-white transition-colors whitespace-nowrap border border-white/10"
                >
                    リセット
                </button>
            </div>
        </div>
    );
}
