import { atom } from 'jotai'

/**
 * Todoの型定義
 */
interface Todo {
    id: number
    text: string
    completed: boolean
}

/**
 * TodoリストのAtom
 * 
 * 配列を保持する基本のAtom
 */
export const todosAtom = atom<Todo[]>([])

/**
 * 派生Atom：完了済みの件数を計算
 * 
 * todosAtomが変更されると自動的に再計算される
 */
export const completedCountAtom = atom((get) => {
    const todos = get(todosAtom)
    return todos.filter(todo => todo.completed).length
})

/**
 * 書き込みAtom：Todoを追加
 * 
 * 第2引数で受け取った値（text）を使って新しいTodoを追加
 */
export const addTodoAtom = atom(
    null,
    (get, set, text: string) => {
        const todos = get(todosAtom)
        set(todosAtom, [...todos, { id: Date.now(), text, completed: false }])
    }
)

/**
 * 書き込みAtom：Todoの完了状態を切り替え
 */
export const toggleTodoAtom = atom(
    null,
    (get, set, id: number) => {
        const todos = get(todosAtom)
        set(todosAtom, todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ))
    }
)

/**
 * 書き込みAtom：Todoを削除
 */
export const removeTodoAtom = atom(
    null,
    (get, set, id: number) => {
        const todos = get(todosAtom)
        set(todosAtom, todos.filter(todo => todo.id !== id))
    }
)

/**
 * 書き込みAtom：完了済みをすべて削除
 */
export const clearCompletedAtom = atom(
    null,
    (get, set) => {
        const todos = get(todosAtom)
        set(todosAtom, todos.filter(todo => !todo.completed))
    }
)
