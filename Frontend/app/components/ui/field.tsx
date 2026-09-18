import type { HTMLAttributes, LabelHTMLAttributes } from "react";
import { cn } from "~/lib/utils";

export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("space-y-2", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn("text-sm font-medium text-slate-700", className)} {...props} />;
}

export const controlClassName = "flex min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#B4421E] focus:ring-2 focus:ring-[#B4421E]/15";
