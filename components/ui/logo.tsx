import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 font-black text-white shadow-sm",
                className
            )}
        >
            F
        </div>
    );
}
