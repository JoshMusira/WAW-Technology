import { ClipboardList, CircleAlert, ListChecks, UserRound } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { priorities, statuses, useIssues, type Issue, type Priority, type Status } from "~/hooks/use-issues";
import { useAuth } from "~/provider/auth-context";

const labels: Record<Status | Priority, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
};

const statusColors: Record<Status, string> = {
    OPEN: "bg-sky-500",
    IN_PROGRESS: "bg-[#B4421E]",
    RESOLVED: "bg-emerald-500",
    CLOSED: "bg-slate-400",
};

const priorityColors: Record<Priority, string> = {
    LOW: "bg-emerald-500",
    MEDIUM: "bg-amber-500",
    HIGH: "bg-[#B4421E]",
};

const statusVariants: Record<Status, "neutral" | "blue" | "green" | "accent"> = {
    OPEN: "blue",
    IN_PROGRESS: "accent",
    RESOLVED: "green",
    CLOSED: "neutral",
};

function countBy<T extends string>(issues: Issue[], values: readonly T[], key: keyof Issue) {
    return values.map((value) => ({
        value,
        count: issues.filter((issue) => issue[key] === value).length,
    }));
}

export default function Dashboard() {
    const { user } = useAuth();
    const issuesQuery = useIssues({});
    const issues = issuesQuery.data ?? [];
    const statusCounts = countBy(issues, statuses, "status");
    const priorityCounts = countBy(issues, priorities, "priority");
    const assignedIssues = user ? issues.filter((issue) => issue.assignedToId === user.id) : [];

    return (
        <section className="space-y-8">
            <header>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B4421E]">Overview</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
                <p className="mt-2 max-w-2xl text-slate-600">
                    A quick read on the work moving through your team.
                </p>
            </header>

            {issuesQuery.isLoading && <p className="text-sm text-slate-500">Loading dashboard...</p>}

            {issuesQuery.isError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-sm text-red-700">
                        Unable to load dashboard data. Please sign in again.
                    </CardContent>
                </Card>
            )}

            {!issuesQuery.isError && (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <MetricCard
                            icon={<ClipboardList className="h-5 w-5" />}
                            label="Total issues"
                            value={issues.length}
                            detail="Across your workspace"
                            accent="navy"
                        />
                        <MetricCard
                            icon={<UserRound className="h-5 w-5" />}
                            label="Assigned to you"
                            value={assignedIssues.length}
                            detail={user ? `Currently assigned to ${user.name}` : "Sign in to view assignments"}
                            accent="terracotta"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <DistributionCard
                            title="Issues by status"
                            description="How work is progressing right now."
                            rows={statusCounts}
                            colors={statusColors}
                        />
                        <DistributionCard
                            title="Issues by priority"
                            description="Where urgency is concentrated."
                            rows={priorityCounts}
                            colors={priorityColors}
                        />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ListChecks className="h-5 w-5 text-[#B4421E]" />
                                Your assigned issues
                            </CardTitle>
                            <CardDescription>The issues currently waiting for your attention.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {assignedIssues.length ? (
                                <div className="divide-y divide-slate-100">
                                    {assignedIssues.slice(0, 5).map((issue) => (
                                        <div key={issue.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-900">{issue.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">Updated {new Date(issue.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                            <Badge variant={statusVariants[issue.status]}>
                                                {labels[issue.status]}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                                    <CircleAlert className="h-5 w-5 shrink-0 text-slate-400" />
                                    No issues are assigned to you yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </section>
    );
}

function MetricCard({
    icon,
    label,
    value,
    detail,
    accent,
}: Readonly<{
    icon: React.ReactNode;
    label: string;
    value: number;
    detail: string;
    accent: "navy" | "terracotta";
}>) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="relative p-6">
                <div className={`absolute inset-y-0 left-0 w-1 ${accent === "navy" ? "bg-[#05152C]" : "bg-[#B4421E]"}`} />
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{label}</p>
                        <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{value}</p>
                        <p className="mt-2 text-sm text-slate-500">{detail}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${accent === "navy" ? "bg-[#05152C]/10 text-[#05152C]" : "bg-[#B4421E]/10 text-[#B4421E]"}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function DistributionCard<T extends string>({
    title,
    description,
    rows,
    colors,
}: Readonly<{
    title: string;
    description: string;
    rows: readonly { value: T; count: number }[];
    colors: Record<T, string>;
}>) {
    const maximum = Math.max(...rows.map((row) => row.count), 1);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {rows.map((row) => (
                    <div key={row.value}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{labels[row.value as Status | Priority]}</span>
                            <span className="font-semibold text-slate-950">{row.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full ${colors[row.value]}`}
                                style={{ width: `${(row.count / maximum) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
