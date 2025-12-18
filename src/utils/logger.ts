import { createClient } from "@/utils/supabase/server";

export async function logActivity(action: string, details?: any) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Log as anonymous or system if feasible, but our query connects to profile
            console.warn("Attempted to log activity without user context:", action);
            return;
        }

        const { error } = await supabase.from("activity_logs").insert({
            user_id: user.id,
            action,
            details,
        });

        if (error) {
            console.error("Failed to write activity log:", error);
        }
    } catch (err) {
        console.error("Error in logActivity:", err);
    }
}
