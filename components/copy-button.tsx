"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
    value: string;
}

export function CopyButton({
    value,
    className,
    ...props
}: CopyButtonProps) {
    const [hasCopied, setHasCopied] = React.useState(false);

    React.useEffect(() => {
        setTimeout(() => {
            setHasCopied(false);
        }, 2000);
    }, [hasCopied]);

    return (
        <Button
            size="icon"
            variant="ghost"
            className={cn(
                "relative z-10 h-6 w-6 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50 [&_svg]:h-3 [&_svg]:w-3",
                className
            )}
            onClick={() => {
                navigator.clipboard.writeText(value);
                setHasCopied(true);
            }}
            {...props}
        >
            <span className="sr-only">Copy</span>
            {hasCopied ? <Check /> : <Copy />}
        </Button>
    );
}
