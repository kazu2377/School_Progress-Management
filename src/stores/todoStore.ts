import { create } from 'zustand'

/**
 * Todoアイテムの型定義
 */
interface Todo {
    id: number
    text: string
    completed: boolean
}

/**
 * TodoStoreの状態とアクションの型定義
 */
interface TodoState {
    // 状態
    todos: Todo[]

    // アクション
    addTodo: (text: string) => void
    toggleTodo: (id: number) => void
    removeTodo: (id: number) => void
    clearCompleted: () => void
}

/**
 * TodoStore
 * 
 * 配列を扱う場合のZustandの使い方を学習
 * - 配列の追加: スプレッド演算子で新しい配列を作成
 * - 配列の更新: map で新しい配列を作成
 * - 配列のフィルター: filter で新しい配列を作成
 */
export const useTodoStore = create<TodoState>((set) => ({
    // 初期状態（空の配列）
    todos: [],

    /**
     * Todoを追加
     * - Date.now() でユニークなIDを生成
     * - スプレッド演算子で既存の配列を展開し、新しいアイテムを追加
     */
    addTodo: (text) => set((state) => ({
        todos: [...state.todos, {
            id: Date.now(),
            text,
            completed: false
        }]
    })),

    /**
     * Todoの完了状態を切り替え
     * - map で各アイテムを走査
     * - IDが一致するアイテムのみ completed を反転
     */
    toggleTodo: (id) => set((state) => ({
        todos: state.todos.map(todo =>
            todo.id === id
                ? { ...todo, completed: !todo.completed }
                : todo
        )
    })),

    /**
     * Todoを削除
     * - filter で該当IDのアイテムを除外
     */
    removeTodo: (id) => set((state) => ({
        todos: state.todos.filter(todo => todo.id !== id)
    })),

    /**
     * 完了済みのTodoをすべて削除
     */
    clearCompleted: () => set((state) => ({
        todos: state.todos.filter(todo => !todo.completed)
    })),
}))
