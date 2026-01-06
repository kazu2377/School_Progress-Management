import { atom } from 'jotai'

/**
 * カウンターのAtom（状態の最小単位）
 * 
 * Jotaiでは状態を「Atom」という小さな単位で管理します。
 * Zustandの「大きなStore」とは対照的に、「小さな箱」をたくさん作るイメージです。
 */

// 基本のAtom：数値を保持するだけ
export const countAtom = atom(0)

// 派生Atom（Derived Atom）：他のAtomから計算される読み取り専用の値
// countAtomの値が変わると自動的に再計算されます
export const doubleCountAtom = atom((get) => get(countAtom) * 2)

// 書き込み専用Atom（Write-only Atom）：アクションを定義
// Zustandのアクションに相当しますが、Jotaiでは別のAtomとして定義します
export const incrementAtom = atom(
    null, // 読み取り値はなし
    (get, set) => set(countAtom, get(countAtom) + 1)
)

export const decrementAtom = atom(
    null,
    (get, set) => set(countAtom, get(countAtom) - 1)
)

export const resetAtom = atom(
    null,
    (_get, set) => set(countAtom, 0)
)

export const incrementByAtom = atom(
    null,
    (get, set, amount: number) => set(countAtom, get(countAtom) + amount)
)
