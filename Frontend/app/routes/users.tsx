import { ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/provider/auth-context";
import { useUpdateUserRole, useUsers, type DirectoryUser, type UserRole } from "~/hooks/use-issues";

const roleLabels: Record<UserRole, string> = {
    ADMIN: "Administrator",
    STANDARD_USER: "Standard user",
};

export default function Users() {
    const { user } = useAuth();
    const usersQuery = useUsers();
    const updateRole = useUpdateUserRole();
    const isAdmin = user?.role === "ADMIN";

    return (
        <section className="space-y-8">
            <header>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B4421E]">Workspace</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Users</h1>
                <p className="mt-2 max-w-2xl text-slate-600">View your team and manage access levels.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <UsersRound className="h-5 w-5 text-[#B4421E]" />
                        Team directory
                    </CardTitle>
                    <CardDescription>
                        {isAdmin ? "As an administrator, you can change a team member's role." : "Only administrators can change user roles."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {usersQuery.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading users...</p>}

                    {usersQuery.isError && (
                        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Unable to load users. Please sign in again.</p>
                    )}

                    {usersQuery.data && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-155 text-left text-sm">
                                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="pb-3 pr-4 font-semibold">Team member</th>
                                        <th className="pb-3 pr-4 font-semibold">Email</th>
                                        <th className="pb-3 pr-4 font-semibold">Role</th>
                                        <th className="pb-3 text-right font-semibold">Access</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {usersQuery.data.map((directoryUser) => (
                                        <UserRow
                                            key={directoryUser.id}
                                            user={directoryUser}
                                            isAdmin={isAdmin}
                                            isPending={updateRole.isPending && updateRole.variables?.id === directoryUser.id}
                                            onRoleChange={(role) => updateRole.mutate({ id: directoryUser.id, role })}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

function UserRow({
    user,
    isAdmin,
    isPending,
    onRoleChange,
}: Readonly<{
    user: DirectoryUser;
    isAdmin: boolean | undefined;
    isPending: boolean;
    onRoleChange: (role: UserRole) => void;
}>) {
    const role = user.role as UserRole;

    return (
        <tr>
            <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#05152C] text-sm font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-900">{user.name}</span>
                </div>
            </td>
            <td className="py-4 pr-4 text-slate-600">{user.email}</td>
            <td className="py-4 pr-4">
                <Badge variant={role === "ADMIN" ? "accent" : "neutral"}>
                    {roleLabels[role] ?? user.role}
                </Badge>
            </td>
            <td className="py-4 text-right">
                {isAdmin ? (
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <span className="sr-only">Change role for {user.name}</span>
                        <select
                            value={role}
                            disabled={isPending}
                            onChange={(event) => onRoleChange(event.target.value as UserRole)}
                            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-[#B4421E] focus:ring-2 focus:ring-[#B4421E]/15 disabled:opacity-60"
                        >
                            <option value="STANDARD_USER">Standard user</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                    </label>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                        Admin only
                    </span>
                )}
            </td>
        </tr>
    );
}
