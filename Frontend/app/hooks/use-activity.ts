import { useQuery } from "@tanstack/react-query";
import { fetchData } from "~/lib/fetch-util";

export type ActivityLog = {
    id: number;
    action: string;
    entityType: string;
    entityId: number | null;
    description: string;
    createdAt: string;
    actor: {
        id: number;
        name: string;
        email: string;
    };
};

export function useActivityLogs() {
    return useQuery({
        queryKey: ["activity"],
        queryFn: () => fetchData<ActivityLog[]>("/activity"),
    });
}