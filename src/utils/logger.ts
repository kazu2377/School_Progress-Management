import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface LogContext {
    requestId: string;
    ipAddress: string | null;
    userAgent: string | null;
    referer: string | null;
}

export interface ActivityLogParams {
    action_type: string;
    resource: string;
    action?: string; // 互換性のため残存（内部で action_type と結合可）
    details?: any;

    // 追加フィールド
    message?: string;
    old_value?: any;
    new_value?: any;
    input_params?: any;
    status_code?: number;
    error?: unknown;
}

/**
 * ログ記録用のユーティリティクラス
 * サーバーコンポーネントまたはサーバーアクション内で使用してください。
 */
export class Logger {
    private context: LogContext;
    private startTime: number;

    private constructor(context: LogContext) {
        this.context = context;
        this.startTime = performance.now();
    }

    /**
     * Loggerのインスタンスを初期化します。
     * リクエストヘッダーからコンテキスト情報を自動的に収集します。
     */
    public static async init(): Promise<Logger> {
        const headerList = await headers();

        const requestId = headerList.get("X-Request-ID") || crypto.randomUUID();
        const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0] || null;
        const userAgent = headerList.get("user-agent");
        const referer = headerList.get("referer");

        return new Logger({
            requestId,
            ipAddress,
            userAgent,
            referer,
        });
    }

    /**
     * ログをデータベースに記録します
     */
    public async log(level: LogLevel, params: ActivityLogParams) {
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            const durationMs = Math.round(performance.now() - this.startTime);
            const environment = process.env.NODE_ENV || "development";

            // エラーオブジェクトの処理
            let errorMessage: string | undefined;
            let stackTrace: string | undefined;
            if (params.error instanceof Error) {
                errorMessage = params.error.message;
                stackTrace = params.error.stack;
            } else if (params.error) {
                errorMessage = String(params.error);
            }

            // Diffの自動計算（両方存在する場合のみ）
            let changedFields = undefined;
            if (params.old_value && params.new_value) {
                changedFields = this.calculateChangedFields(params.old_value, params.new_value);
            }

            // DBへ保存
            const { error } = await supabase.from("activity_logs").insert({
                // 基本情報
                request_id: this.context.requestId,
                environment: environment,
                severity: level,
                created_at: new Date().toISOString(),

                // 誰が
                user_id: user?.id || null,
                ip_address: this.context.ipAddress,
                user_agent: this.context.userAgent,
                role: user?.user_metadata?.role || user?.role || "user", // メタデータまたは基本ロール

                // 何を
                action_type: params.action_type,
                resource: params.resource,
                action: params.action || `${params.resource}.${params.action_type}`, // 互換性のため
                endpoint: this.context.referer, // 完全なパスはmiddleware等からの引き渡しが必要だが、一旦refererで代用

                // どうなったか
                status_code: params.status_code || (level === "ERROR" ? 500 : 200),
                duration_ms: durationMs,
                error_message: errorMessage,
                stack_trace: stackTrace,

                // 変化の内容
                details: this.sanitizeDetails(params.details || { message: params.message }), // 互換性のための details
                old_value: this.sanitizeDetails(params.old_value),
                new_value: this.sanitizeDetails(params.new_value),
                changed_fields: changedFields,
                input_params: this.sanitizeDetails(params.input_params),
            });

            if (error) {
                console.error("Failed to write activity log to DB:", error);
                // DB書き込み失敗時はコンソールに出して最低限の記録を残す
                console.dir(params, { depth: null });
            }

        } catch (err) {
            console.error("Critical Error in Logger:", err);
        }
    }

    public async info(params: ActivityLogParams) {
        await this.log("INFO", params);
    }

    public async warn(params: ActivityLogParams) {
        await this.log("WARN", params);
    }

    public async error(params: ActivityLogParams) {
        await this.log("ERROR", params);
    }

    // --- Private Helpers ---

    private sanitizeDetails(data: any): any {
        if (!data) return data;
        // 再帰的に処理するための簡易実装（JSONシリアライズ可能なもの前提）
        try {
            const str = JSON.stringify(data);
            const obj = JSON.parse(str);
            return this.maskSensitiveData(obj);
        } catch {
            return data;
        }
    }

    private maskSensitiveData(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;

        if (Array.isArray(obj)) {
            return obj.map(item => this.maskSensitiveData(item));
        }

        const maskedKeys = ['password', 'token', 'secret', 'credit_card', 'api_key'];

        for (const key in obj) {
            if (maskedKeys.some(mask => key.toLowerCase().includes(mask))) {
                obj[key] = '********';
            } else if (key.toLowerCase() === 'email') {
                obj[key] = this.maskEmail(obj[key]);
            } else {
                obj[key] = this.maskSensitiveData(obj[key]);
            }
        }
        return obj;
    }

    private maskEmail(email: string): string {
        if (typeof email !== 'string' || !email.includes("@")) return email;
        const [local, domain] = email.split("@");
        if (local.length <= 1) return `*@${domain}`;
        return `${local[0]}***@${domain}`;
    }

    private calculateChangedFields(oldVal: any, newVal: any): string[] {
        const changes: string[] = [];
        // 両方がオブジェクトの場合のみ比較
        if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
            const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
            for (const key of allKeys) {
                if (JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])) {
                    changes.push(key);
                }
            }
        }
        return changes;
    }
}

// 既存コードとの互換性のためのラッパー関数
export async function logActivity(action: string, details?: any) {
    const logger = await Logger.init();
    await logger.info({
        action_type: "b_compatibility_log", // 後方互換性用
        resource: "system",
        action: action,
        details: details,
        message: `Legacy log: ${action}`
    });
}
