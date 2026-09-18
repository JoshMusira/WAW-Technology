import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "~/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", {
    variants: {
        variant: {
            neutral: "border-slate-200 bg-slate-100 text-slate-700",
            accent: "border-[#B4421E]/20 bg-[#B4421E]/10 text-[#963719]",
            blue: "border-blue-200 bg-blue-50 text-blue-700",
            green: "border-emerald-200 bg-emerald-50 text-emerald-700",
        },
    },
    defaultVariants: { variant: "neutral" },
});

export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
    return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
