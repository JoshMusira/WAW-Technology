import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4421E] disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-[#05152C] text-white hover:bg-[#0b2447]",
                accent: "bg-[#B4421E] text-white hover:bg-[#963719]",
                outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
                ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 px-3",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    },
);

export function Button({ className, variant, size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
    return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
