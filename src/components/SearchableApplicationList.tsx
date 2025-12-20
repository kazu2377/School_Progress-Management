"use client";

import { useState } from "react";
import { Search, Filter, Calendar, CheckSquare } from "lucide-react";
import EditApplicationModal from "./EditApplicationModal";

export default function SearchableApplicationList({ initialApplications }: { initialApplications: any[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [docsFilter, setDocsFilter] = useState({
        resume: false,
        cv: false,
        portfolio: false
    });

    const filteredApplications = initialApplications.filter((app) => {
        const matchesQuery = app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.position?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "" || app.status === statusFilter;
        const matchesDate = dateFilter === "" || app.application_date === dateFilter;

        const matchesDocs = (!docsFilter.resume || app.resume_created) &&
            (!docsFilter.cv || app.work_history_created) &&
            (!docsFilter.portfolio || app.portfolio_submitted);

        return matchesQuery && matchesStatus && matchesDate && matchesDocs;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-slate-50/50 space-y-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[240px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="企業名や職種で検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 min-w-[140px]">
                        <Filter className="text-muted" size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none bg-white text-sm"
                        >
                            <option value="">全ての状態</option>
                            <option value="応募中">応募中</option>
                            <option value="書類通過">書類通過</option>
                            <option value="一次面接">一次面接</option>
                            <option value="最終面接">最終面接</option>
                            <option value="内定">内定</option>
                            <option value="不採用">不採用</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-muted" size={18} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-1.5 border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none bg-white text-sm"
                        />
                        {dateFilter && (
                            <button onClick={() => setDateFilter("")} className="text-xs text-muted hover:text-accent">クリア</button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 border-l border-border pl-6">
                        <div className="flex items-center gap-1 text-muted mr-2">
                            <CheckSquare size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">書類準備済:</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={docsFilter.resume}
                                onChange={(e) => setDocsFilter({ ...docsFilter, resume: e.target.checked })}
                                className="w-4 h-4 rounded text-accent border-border"
                            />
                            <span className={`text-sm ${docsFilter.resume ? 'text-accent font-bold' : 'text-muted group-hover:text-primary'} transition-colors`}>履歴書</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={docsFilter.cv}
                                onChange={(e) => setDocsFilter({ ...docsFilter, cv: e.target.checked })}
                                className="w-4 h-4 rounded text-accent border-border"
                            />
                            <span className={`text-sm ${docsFilter.cv ? 'text-accent font-bold' : 'text-muted group-hover:text-primary'} transition-colors`}>職歴書</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={docsFilter.portfolio}
                                onChange={(e) => setDocsFilter({ ...docsFilter, portfolio: e.target.checked })}
                                className="w-4 h-4 rounded text-accent border-border"
                            />
                            <span className={`text-sm ${docsFilter.portfolio ? 'text-accent font-bold' : 'text-muted group-hover:text-primary'} transition-colors`}>PF</span>
                        </label>
                    </div>
                </div>
            </div>

            {filteredApplications.length === 0 ? (
                <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <Search size={32} />
                    </div>
                    <div>
                        <p className="font-semibold">条件に一致するデータが見つかりません</p>
                        <p className="text-sm">検索条件を変更してみてください</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-border">
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">応募日</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">企業名</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">ステータス</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">書類準備</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-sm text-muted font-medium italic">{app.application_date || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-primary group-hover:text-accent transition-colors">{app.company}</div>
                                        <div className="text-xs text-muted/80">{app.position}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight
                                    ${app.status === '書類通過' || app.status === '内定' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                app.status === '不採用' || app.status === '書類不通過' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                    'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${app.resume_created ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300"}`}>履歴書</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${app.work_history_created ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300"}`}>職歴書</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${app.portfolio_submitted ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-300"}`}>PF</span>
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
            <div className="p-4 bg-slate-50/30 border-t border-border">
                <p className="text-[11px] text-muted text-right">表示中: <span className="font-bold text-primary">{filteredApplications.length}</span> / {initialApplications.length} 件</p>
            </div>
        </div>
    );
}
