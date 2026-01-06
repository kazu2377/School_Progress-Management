import { create } from 'zustand'

/**
 * カウンターの状態の型定義
 * 
 * Zustandでは状態(state)とアクション(actions)を同じインターフェースで定義します
 */
interface CounterState {
    // 状態
    count: number

    // アクション（状態を変更する関数）
    increment: () => void
    decrement: () => void
    reset: () => void
    incrementBy: (amount: number) => void
}

/**
 * カウンターStore
 * 
 * create<T>() でストアを作成
 * - 引数の関数は `set` を受け取る
 * - set() で状態を更新する
 * - set((state) => newState) で現在の状態を参照して更新できる
 */
export const useCounterStore = create<CounterState>((set) => ({
    // 初期状態
    count: 0,

    // アクション定義
    // set() に新しい状態オブジェクトを渡すと、その部分だけ更新される（マージ）
    increment: () => set((state) => ({ count: state.count + 1 })),

    decrement: () => set((state) => ({ count: state.count - 1 })),

    reset: () => set({ count: 0 }),

    // 引数を受け取るアクション
    incrementBy: (amount) => set((state) => ({ count: state.count + amount })),
}))
