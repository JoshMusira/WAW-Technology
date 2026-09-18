import { Outlet } from "react-router";

export default function AuthLayout() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8">
            <div className="w-full max-w-md">
                <Outlet />
            </div>
        </main>
    );
}
