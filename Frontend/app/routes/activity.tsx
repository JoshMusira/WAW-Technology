import { Activity, CircleAlert, LogIn, MessageSquare, ShieldCheck } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useActivityLogs, type ActivityLog } from "~/hooks/use-activity";

const actionLabels: Record<string, string> = {
    CREATED: "Created",
    UPDATED: "Updated",
    COMMENTED: "Commented",
    ROLE_CHANGED: "Role changed",
    SIGNED_IN: "Signed in",
};

function actionIcon(action: string) {
    if (action === "SIGNED_IN") return <LogIn className="h-4 w-4" />;
    if (action === "COMMENTED") return <MessageSquare className="h-4 w-4" />;
    if (action === "ROLE_CHANGED") return <ShieldCheck className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function ActivityPage() {
    const activityQuery = useActivityLogs();

    return (
        <section className="space-y-8">
            <header>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B4421E]">Workspace</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Activity log</h1>
                <p className="mt-2 max-w-2xl text-slate-600">See the latest changes and actions across your workspace.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="h-5 w-5 text-[#B4421E]" />
                        Recent activity
                    </CardTitle>
                    <CardDescription>Showing the 100 most recent recorded actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {activityQuery.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading activity...</p>}

                    {activityQuery.isError && (
                        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                            <CircleAlert className="h-5 w-5 shrink-0" />
                            Unable to load activity. Please sign in again.
                        </div>
                    )}

                    {activityQuery.data && !activityQuery.data.length && (
                        <p className="py-10 text-center text-sm text-slate-500">No activity has been recorded yet.</p>
                    )}

                    {activityQuery.data && activityQuery.data.length > 0 && (
                        <div className="divide-y divide-slate-100">
                            {activityQuery.data.map((log) => <ActivityRow key={log.id} log={log} />)}
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

function ActivityRow({ log }: Readonly<{ log: ActivityLog }>) {
    return (
        <article className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#05152C] text-white">
                {actionIcon(log.action)}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <p className="text-sm text-slate-800">
                        <span className="font-semibold">{log.actor.name}</span> {log.description}
                    </p>
                    <time dateTime={log.createdAt} className="shrink-0 text-xs text-slate-500">{formatDate(log.createdAt)}</time>
                </div>
                <Badge className="mt-2" variant={log.action === "ROLE_CHANGED" ? "accent" : "neutral"}>
                    {actionLabels[log.action] ?? log.action.replaceAll("_", " ")}
                </Badge>
            </div>
        </article>
    );
}