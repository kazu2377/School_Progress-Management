'use client'

import { useState } from 'react'
import { useCounterStore } from '@/stores/counterStore'
import { useTodoStore } from '@/stores/todoStore'

/**
 * Zustandデモページ
 * 
 * このページでは2つのサンプルを通じてZustandの基本を学習します：
 * 1. カウンター：基本的な状態更新
 * 2. Todoリスト：配列操作
 */
export default function ZustandDemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* ヘッダー */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        🐻 Zustand デモ
                    </h1>
                    <p className="text-slate-300">
                        シンプルで軽量なReact状態管理ライブラリ
                    </p>
                </header>

                {/* サンプル一覧 */}
                <div className="grid md:grid-cols-2 gap-8">
                    <CounterDemo />
                    <TodoDemo />
                </div>

                {/* 解説セクション */}
                <div className="mt-12 bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">📖 Zustandの基本</h2>
                    <div className="space-y-4 text-slate-300">
                        <div>
                            <h3 className="text-purple-400 font-semibold">1. Storeの作成</h3>
                            <code className="block bg-slate-900 p-3 rounded-lg mt-2 text-sm">
                                {`const useStore = create((set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }))`}
                            </code>
                        </div>
                        <div>
                            <h3 className="text-purple-400 font-semibold">2. コンポーネントで使用</h3>
                            <code className="block bg-slate-900 p-3 rounded-lg mt-2 text-sm">
                                {`const { count, increment } = useStore()`}
                            </code>
                        </div>
                        <div>
                            <h3 className="text-purple-400 font-semibold">3. 特定の状態だけ取得（パフォーマンス最適化）</h3>
                            <code className="block bg-slate-900 p-3 rounded-lg mt-2 text-sm">
                                {`const count = useStore((state) => state.count)`}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * カウンターデモコンポーネント
 * 
 * useCounterStore() でストアにアクセス
 * - 状態とアクションをまとめて取得
 */
function CounterDemo() {
    // ストアから状態とアクションを取得
    const { count, increment, decrement, reset, incrementBy } = useCounterStore()

    return (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🔢 カウンター
            </h2>

            {/* カウント表示 */}
            <div className="text-6xl font-bold text-center py-8 text-white">
                {count}
            </div>

            {/* ボタン群 */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={decrement}
                    className="px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium transition-colors"
                >
                    − 減らす
                </button>
                <button
                    onClick={increment}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                >
                    ＋ 増やす
                </button>
                <button
                    onClick={() => incrementBy(10)}
                    className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                >
                    +10
                </button>
                <button
                    onClick={reset}
                    className="px-4 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-medium transition-colors"
                >
                    リセット
                </button>
            </div>

            {/* コード解説 */}
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
                <pre>{`// 使い方
const { count, increment } = useCounterStore()
// または
const count = useCounterStore(s => s.count)`}</pre>
            </div>
        </div>
    )
}

/**
 * Todoデモコンポーネント
 * 
 * 配列を扱うZustandの使い方を学習
 */
function TodoDemo() {
    const [inputText, setInputText] = useState('')

    // ストアから状態とアクションを取得
    const { todos, addTodo, toggleTodo, removeTodo, clearCompleted } = useTodoStore()

    // 別ストアー(CounterStore)の状態も取得できます！
    const { count } = useCounterStore()

    // フォーム送信
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim()) return
        addTodo(inputText.trim())
        setInputText('')
    }

    // 完了済みの数
    const completedCount = todos.filter(t => t.completed).length

    return (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                ✅ Todoリスト
                {/* 別ストアの値をここに表示 */}
                <span className="text-sm bg-slate-900 px-2 py-1 rounded text-purple-400 font-normal">
                    Counter: {count}
                </span>
            </h2>

            {/* 入力フォーム */}
            <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="新しいタスクを入力..."
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                    >
                        追加
                    </button>
                </div>
            </form>

            {/* Todoリスト */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {todos.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">タスクがありません</p>
                ) : (
                    todos.map(todo => (
                        <div
                            key={todo.id}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${todo.completed
                                ? 'bg-slate-700/30 text-slate-500'
                                : 'bg-slate-700/50 text-white'
                                }`}
                        >
                            <button
                                onClick={() => toggleTodo(todo.id)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-slate-500 hover:border-emerald-400'
                                    }`}
                            >
                                {todo.completed && <span className="text-white text-sm">✓</span>}
                            </button>
                            <span className={`flex-1 ${todo.completed ? 'line-through' : ''}`}>
                                {todo.text}
                            </span>
                            <button
                                onClick={() => removeTodo(todo.id)}
                                className="text-rose-400 hover:text-rose-300 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* フッター */}
            {todos.length > 0 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">
                        {completedCount}/{todos.length} 完了
                    </span>
                    {completedCount > 0 && (
                        <button
                            onClick={clearCompleted}
                            className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                        >
                            完了済みを削除
                        </button>
                    )}
                </div>
            )}

            {/* コード解説 */}
            <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
                <pre>{`// 配列の更新
addTodo: (text) => set(s => ({
  todos: [...s.todos, newTodo]
}))`}</pre>
            </div>
        </div>
    )
}
