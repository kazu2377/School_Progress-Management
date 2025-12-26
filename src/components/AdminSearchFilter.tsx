"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminSearchFilter({ courses }: { courses: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [qStudent, setQStudent] = useState(searchParams.get("q_student") || "");
    const [qCompany, setQCompany] = useState(searchParams.get("q_company") || "");
    const [qPosition, setQPosition] = useState(searchParams.get("q_position") || "");
    const [qFile, setQFile] = useState(searchParams.get("q_file") || "");

    const [courseId, setCourseId] = useState(searchParams.get("course_id") || "");
    const [month, setMonth] = useState(searchParams.get("month") || "");
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [result, setResult] = useState(searchParams.get("result") || "");

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString());
        // Remove old 'q' if exists
        params.delete("q");

        if (qStudent) params.set("q_student", qStudent); else params.delete("q_student");
        if (qCompany) params.set("q_company", qCompany); else params.delete("q_company");
        if (qPosition) params.set("q_position", qPosition); else params.delete("q_position");
        if (qFile) params.set("q_file", qFile); else params.delete("q_file");

        if (courseId) params.set("course_id", courseId); else params.delete("course_id");
        if (month) params.set("month", month); else params.delete("month");
        if (status) params.set("status", status); else params.delete("status");
        if (result) params.set("result", result); else params.delete("result");

        router.push(`/admin/dashboard?${params.toString()}`);
    };

    const handleReset = () => {
        const tab = searchParams.get("tab") || "students";
        router.push(`/admin/dashboard?tab=${tab}`);
        setQStudent("");
        setQCompany("");
        setQPosition("");
        setQFile("");
        setCourseId("");
        setMonth("");
        setStatus("");
        setResult("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
                <input
                    type="text"
                    placeholder="受講生名で検索..."
                    value={qStudent}
                    onChange={(e) => setQStudent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
                />
                <input
                    type="text"
                    placeholder="企業名で検索..."
                    value={qCompany}
                    onChange={(e) => setQCompany(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
                />
                <input
                    type="text"
                    placeholder="職種で検索..."
                    value={qPosition}
                    onChange={(e) => setQPosition(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
                />
                <input
                    type="text"
                    placeholder="書類名で検索..."
                    value={qFile}
                    onChange={(e) => setQFile(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900"
                />
            </div>

            <div className="flex flex-wrap gap-3 items-center w-full">
                <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900 min-w-[150px]"
                >
                    <option value="">すべてのコース</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900 min-w-[150px]"
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
                    className="bg-primary-light border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:border-accent outline-none bg-indigo-900 min-w-[150px]"
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
                <div className="flex gap-2 ml-auto">
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
        </div>
    );
}
