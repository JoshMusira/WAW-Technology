import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useLoginMutation } from "~/hooks/use-auth";
import { useAuth } from "~/provider/auth-context";

export default function Login() {
    const navigate = useNavigate();
    const { setSession } = useAuth();
    const loginMutation = useLoginMutation();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const response = await loginMutation.mutateAsync({
            email: String(formData.get("email") ?? "").trim(),
            password: String(formData.get("password") ?? ""),
        });
        setSession(response.accessToken, response.refreshToken, response.user);
        navigate("/dashboard");
    };

    return (
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-slate-600">Sign in to continue to IssueTracker.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-700">
                    Email
                    <input name="email" type="email" required autoComplete="email" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                    Password
                    <span className="relative mt-1 block">
                        <input name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" className="block w-full rounded-md border border-slate-300 px-3 py-2 pr-10" />
                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-900">
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                {showPassword ? <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></> : <><path d="m3 3 18 18" /><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.1 3.6M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.5-.7" /></>}
                            </svg>
                        </button>
                    </span>
                </label>
                {loginMutation.isError && (
                    <p role="alert" className="text-sm text-red-600">{loginMutation.error.message}</p>
                )}
                <button type="submit" disabled={loginMutation.isPending} className="w-full rounded-md bg-[#05152C] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                    {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
                Need an account? <Link to="/register" className="font-semibold text-blue-700 hover:underline">Register</Link>
            </p>
        </section>
    );
}
