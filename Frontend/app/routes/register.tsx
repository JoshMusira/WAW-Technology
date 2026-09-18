import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useSignUpMutation } from "~/hooks/use-auth";

export type SignupFormData = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function Register() {
    const navigate = useNavigate();
    const signupMutation = useSignUpMutation();
    const [passwordError, setPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data: SignupFormData = {
            name: String(formData.get("name") ?? "").trim(),
            email: String(formData.get("email") ?? "").trim(),
            password: String(formData.get("password") ?? ""),
            confirmPassword: String(formData.get("confirmPassword") ?? ""),
        };

        if (data.password !== data.confirmPassword) {
            setPasswordError("Passwords must match.");
            return;
        }

        setPasswordError("");
        await signupMutation.mutateAsync({
            name: data.name,
            email: data.email,
            password: data.password,
        });
        navigate("/login");
    };

    return (
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-2 text-slate-600">Start managing your issues with IssueTracker.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-700">
                    Name
                    <input name="name" required autoComplete="name" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                    Email
                    <input name="email" type="email" required autoComplete="email" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                    Password
                    <span className="relative mt-1 block">
                        <input name="password" type={showPassword ? "text" : "password"} minLength={6} required autoComplete="new-password" className="block w-full rounded-md border border-slate-300 px-3 py-2 pr-10" />
                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-900">
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                {showPassword ? <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></> : <><path d="m3 3 18 18" /><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.1 3.6M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.5-.7" /></>}
                            </svg>
                        </button>
                    </span>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                    Confirm password
                    <span className="relative mt-1 block">
                        <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} minLength={6} required autoComplete="new-password" className="block w-full rounded-md border border-slate-300 px-3 py-2 pr-10" />
                        <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} title={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-slate-900">
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                                {showConfirmPassword ? <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></> : <><path d="m3 3 18 18" /><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.1 3.6M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.5-.7" /></>}
                            </svg>
                        </button>
                    </span>
                </label>
                {(passwordError || signupMutation.isError) && (
                    <p role="alert" className="text-sm text-red-600">{passwordError || signupMutation.error?.message || "Unable to create account."}</p>
                )}
                <button type="submit" disabled={signupMutation.isPending} className="w-full rounded-md bg-[#05152C] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                    {signupMutation.isPending ? "Creating account..." : "Create account"}
                </button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
                Already have an account? <Link to="/login" className="font-semibold text-blue-700 hover:underline">Log in</Link>
            </p>
        </section>
    );
}
