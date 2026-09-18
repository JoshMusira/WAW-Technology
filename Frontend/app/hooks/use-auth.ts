import { postData } from "~/lib/fetch-util";
import type { SignupFormData } from "~/routes/register";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export type LoginPayload = {
    email: string;
    password: string;
};

export type AuthUser = {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: string;
};

export type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
};

export type SignUpPayload = Omit<SignupFormData, "confirmPassword">;

function errorMessage(error: Error, fallback: string) {
    const responseError = (error as Error & { response?: { data?: { error?: string } } }).response?.data?.error;
    return responseError || error.message || fallback;
}

export const useLoginMutation = () => {
    return useMutation<LoginResponse, Error, LoginPayload>({
        mutationFn: (data) => postData<LoginResponse>("/users/login", data),
        onSuccess: (response) => toast.success(`Welcome back, ${response.user.name}.`),
        onError: (error) => toast.error(errorMessage(error, "Unable to sign in.")),
    });
};

export const useSignUpMutation = () => {
    return useMutation<AuthUser, Error, SignUpPayload>({
        mutationFn: (data) => postData<AuthUser>("/users", data),
        onSuccess: () => toast.success("Account created successfully."),
        onError: (error) => toast.error(errorMessage(error, "Unable to create account.")),
    });
};

export const useLogoutMutation = () => {
    return useMutation<void, Error, { refreshToken: string }>({
        mutationFn: (data) => postData<void>("/users/logout", data),
        onSuccess: () => toast.success("You have been signed out."),
        onError: (error) => toast.error(errorMessage(error, "Could not complete sign out.")),
    });
};