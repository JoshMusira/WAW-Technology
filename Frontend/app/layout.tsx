import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { useLogoutMutation } from "~/hooks/use-auth";
import { useAuth } from "~/provider/auth-context";

const navigation = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Issues", to: "/issues" },
    { label: "Users", to: "/users" },
];

export default function AppLayout() {
    const { user, clearSession } = useAuth();
    const logoutMutation = useLogoutMutation();
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = async () => {
        const refreshToken = localStorage.getItem("refreshToken");

        try {
            if (refreshToken) {
                await logoutMutation.mutateAsync({ refreshToken });
            }
        } finally {
            clearSession();
            setProfileOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <header className="border-b border-slate-800/30 bg-[#05152C] text-white">
                <nav
                    aria-label="Primary navigation"
                    className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8"
                >
                    <NavLink
                        to="/dashboard"
                        className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        <img src="/logo.png" alt="" className="h-13 w-13 object-contain" />
                        <span className="text-[24px] font-bold tracking-tight text-[#B4421E]">IssueTracker</span>
                    </NavLink>

                    <div className="order-3 flex w-full items-center justify-center gap-1 sm:gap-2 md:order-none md:w-auto">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${isActive
                                        ? "bg-white/15 text-white"
                                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {user ? (
                        <div className="relative shrink-0 border-l border-white/20 pl-4">
                            <button
                                type="button"
                                onClick={() => setProfileOpen((isOpen) => !isOpen)}
                                aria-expanded={profileOpen}
                                aria-haspopup="menu"
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B4421E] text-sm font-bold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="hidden max-w-32 truncate text-sm font-semibold text-white sm:block">{user.name}</span>
                                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-300">
                                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {profileOpen && (
                                <div role="menu" className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg bg-white p-3 text-slate-900 shadow-lg ring-1 ring-black/10">
                                    <div className="border-b border-slate-100 px-2 pb-3">
                                        <p className="truncate font-semibold">{user.name}</p>
                                        <p className="truncate text-sm text-slate-500">{user.email}</p>
                                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#B4421E]">{user.role.replaceAll("_", " ")}</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleLogout}
                                        disabled={logoutMutation.isPending}
                                        className="mt-2 flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {logoutMutation.isPending ? "Signing out..." : "Logout"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex shrink-0 items-center gap-2 border-l border-white/20 pl-4 text-sm">
                            <NavLink to="/login" className="rounded-md px-2 py-2 text-slate-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                                Login
                            </NavLink>
                            <NavLink to="/register" className="rounded-md bg-white px-3 py-2 font-semibold text-[#05152C] transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                                Register
                            </NavLink>
                        </div>
                    )}
                </nav>
            </header>

            <main className="mx-auto flex min-h-[calc(100vh-9.5rem)] w-full max-w-7xl flex-col px-5 py-8 lg:px-8">
                <Outlet />
            </main>

            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
                    <p>IssueTracker</p>
                    <p>Keep every issue moving forward.</p>
                </div>
            </footer>
        </div>
    );
}
