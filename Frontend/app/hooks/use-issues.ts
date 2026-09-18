import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchData, patchData, postData } from "~/lib/fetch-util";
import { toast } from "sonner";

export const priorities = ["LOW", "MEDIUM", "HIGH"] as const;
export const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export type Priority = (typeof priorities)[number];
export type Status = (typeof statuses)[number];

export type IssueUser = {
    id: number;
    name: string;
    email: string;
};

export type IssueComment = {
    id: number;
    body: string;
    createdAt: string;
    author: { id: number; name: string };
};

export type Issue = {
    id: number;
    title: string;
    description: string;
    priority: Priority;
    status: Status;
    createdById: number;
    assignedToId: number | null;
    createdBy: IssueUser;
    assignedTo: IssueUser | null;
    comments: IssueComment[];
    createdAt: string;
    updatedAt: string;
};

export type DirectoryUser = IssueUser & { role: string };

type IssueFilters = {
    status?: string;
    priority?: string;
    assignedToId?: string;
    search?: string;
};

type IssuePayload = {
    title: string;
    description: string;
    priority: Priority;
    assignedToId?: number;
};

function errorMessage(error: Error, fallback: string) {
    const responseError = (error as Error & { response?: { data?: { error?: string } } }).response?.data?.error;
    return responseError || error.message || fallback;
}

async function invalidateIssues(queryClient: ReturnType<typeof useQueryClient>) {
    await queryClient.invalidateQueries({ queryKey: ["issues"] });
}

export function useIssues(filters: IssueFilters) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });
    const queryString = query.toString();

    return useQuery({
        queryKey: ["issues", filters],
        queryFn: () => fetchData<Issue[]>(`/issues${queryString ? `?${queryString}` : ""}`),
    });
}

export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: () => fetchData<DirectoryUser[]>("/users"),
    });
}

export function useCreateIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: IssuePayload) => postData<Issue>("/issues", data),
        onSuccess: async () => {
            toast.success("Issue created successfully.");
            await invalidateIssues(queryClient);
        },
        onError: (error) => toast.error(errorMessage(error, "Unable to create issue.")),
    });
}

export function useUpdateIssue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<IssuePayload> & { status?: Status } }) => patchData<Issue>(`/issues/${id}`, data),
        onSuccess: async (_issue, variables) => {
            toast.success(variables.data.status && Object.keys(variables.data).length === 1 ? "Issue status updated." : "Issue updated successfully.");
            await invalidateIssues(queryClient);
        },
        onError: (error) => toast.error(errorMessage(error, "Unable to update issue.")),
    });
}

export function useAddComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: string }) => postData<IssueComment>(`/issues/${id}/comments`, { body }),
        onSuccess: async () => {
            toast.success("Comment added.");
            await invalidateIssues(queryClient);
        },
        onError: (error) => toast.error(errorMessage(error, "Unable to add comment.")),
    });
}
