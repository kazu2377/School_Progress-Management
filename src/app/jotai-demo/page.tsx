'use client'

import { useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
    countAtom,
    doubleCountAtom,
    incrementAtom,
    decrementAtom,
    resetAtom,
    incrementByAtom
} from '@/atoms/counterAtoms'
import {
    todosAtom,
    completedCountAtom,
    addTodoAtom,
    toggleTodoAtom,
    removeTodoAtom,
    clearCompletedAtom
} from '@/atoms/todoAtoms'

/**
 * Jotaiデモページ
 * 
 * Zustandとの違いを体験するためのサンプルです。
 * Jotaiでは「Atom」という小さな単位で状態を管理します。
 */
export default function JotaiDemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* ヘッダー */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        👻 Jotai デモ
                    </h1>
                    <p className="text-slate-300">
                        プリミティブでフレキシブルなReact状態管理
                    </p>
                </header>

                {/* サンプル一覧 */}
                <div className="grid md:grid-cols-2 gap-8">
                    <CounterDemo />
                    <TodoDemo />
                </div>

                {/* 解説セクション */}
                <div className="mt-12 bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">📖 Jotaiの基本</h2>
                    <div className="space-y-4 text-slate-300">
                        <div>
                            <h3 className="text-blue-400 font-semibold">1. Atomを定義</h3>
                            <code className="block bg-slate-900 p-3 rounded-lg mt-2 text-sm">
                                {`const countAtom = atom(0)  // 初期値0の状態`}
                            </code>
                        </div>
                        <div>
                            <h3 className="text-blue-400 font-semibold">2. コンポーネントで使用</h3>
                            <code className="block bg-slate-900 p-3 rounded-lg mt-2 text-sm">
                                {`const [count, setCount] = useAtom(countAtom)  // useStateと同じ感覚！`}
                            </code>
                        </div>
                        <div>
                            <h3 className="text-blue-400 font-semibold">3. 派生Atom（自動計算）</h3>
                            <code className="block bg-slate-900 p-3 rounded-lg mt-2 text-sm">
                                {`const doubleAtom = atom((get) => get(countAtom) * 2)  // countが変わると自動更新`}
                            </code>
                        </div>
                    </div>
                </div>

                {/* Zustandとの比較 */}
                <div className="mt-8 bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">🔄 Zustandとの違い</h2>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-purple-900/30 p-4 rounded-lg">
                            <h3 className="text-purple-400 font-semibold mb-2">Zustand</h3>
                            <ul className="text-slate-300 space-y-1">
                                <li>• 1つの大きなStoreに全部入れる</li>
                                <li>• アクションもStoreに定義</li>
                                <li>• トップダウン設計</li>
                            </ul>
                        </div>
                        <div className="bg-blue-900/30 p-4 rounded-lg">
                            <h3 className="text-blue-400 font-semibold mb-2">Jotai</h3>
                            <ul className="text-slate-300 space-y-1">
                                <li>• 小さなAtomをたくさん作る</li>
                                <li>• アクションも別のAtomとして定義</li>
                                <li>• ボトムアップ設計</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * カウンターデモコンポーネント（Jotai版）
 */
function CounterDemo() {
    // useAtom: 読み書き両方
    const [count, setCount] = useAtom(countAtom)

    // useAtomValue: 読み取り専用（派生Atomに最適）
    const doubleCount = useAtomValue(doubleCountAtom)

    // useSetAtom: 書き込み専用（アクションAtomに最適）
    const increment = useSetAtom(incrementAtom)
    const decrement = useSetAtom(decrementAtom)
    const reset = useSetAtom(resetAtom)
    const incrementBy = useSetAtom(incrementByAtom)

    return (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🔢 カウンター
            </h2>

            {/* カウント表示 */}
            <div className="text-6xl font-bold text-center py-8 text-white">
                {count}
            </div>

            {/* 派生Atomの値を表示 */}
            <div className="text-center mb-4 text-blue-400">
                2倍の値（派生Atom）: {doubleCount}
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
                    className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
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
                <pre>{`// Jotaiの使い方
const [count, setCount] = useAtom(countAtom)
// または読み取り専用
const count = useAtomValue(countAtom)`}</pre>
            </div>
        </div>
    )
}

/**
 * Todoデモコンポーネント（Jotai版）
 */
function TodoDemo() {
    const [inputText, setInputText] = useState('')

    // 状態の読み取り
    const todos = useAtomValue(todosAtom)
    const completedCount = useAtomValue(completedCountAtom)

    // 別のAtom（Counter）の値も取得できる
    const count = useAtomValue(countAtom)

    // アクションAtom
    const addTodo = useSetAtom(addTodoAtom)
    const toggleTodo = useSetAtom(toggleTodoAtom)
    const removeTodo = useSetAtom(removeTodoAtom)
    const clearCompleted = useSetAtom(clearCompletedAtom)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputText.trim()) return
        addTodo(inputText.trim())
        setInputText('')
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                ✅ Todoリスト
                <span className="text-sm bg-slate-900 px-2 py-1 rounded text-blue-400 font-normal">
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
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
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
                <pre>{`// 派生Atomで自動計算
const completedCountAtom = atom((get) =>
  get(todosAtom).filter(t => t.completed).length
)`}</pre>
            </div>
        </div>
    )
}
