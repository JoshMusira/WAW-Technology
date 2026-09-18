import { postData } from "~/lib/fetch-util";
import type { SignupFormData } from "~/routes/register";
import { useMutation } from "@tanstack/react-query";

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

export const useLoginMutation = () => {
    return useMutation<LoginResponse, Error, LoginPayload>({
        mutationFn: (data) => postData<LoginResponse>("/users/login", data),
    });
};

export const useSignUpMutation = () => {
    return useMutation<AuthUser, Error, SignUpPayload>({
        mutationFn: (data) => postData<AuthUser>("/users", data),
    });
};

export const useLogoutMutation = () => {
    return useMutation<void, Error, { refreshToken: string }>({
        mutationFn: (data) => postData<void>("/users/logout", data),
    });
};