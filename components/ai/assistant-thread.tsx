"use client";

import { ActionBarPrimitive, AuiIf, ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { Bot, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAui, useAuiState } from "@assistant-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface AssistantThreadProps {
    title: string;
    subtitle: string;
    inputPlaceholder?: string;
    suggestions?: string[];
    className?: string;
}

function UserMessage() {
    return (
        <MessagePrimitive.Root className="flex flex-row-reverse gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-3.5 w-3.5" />
            </div>
            <div className="max-w-[85%]">
                <div className="rounded-2xl rounded-tr-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                    <MessagePrimitive.Content
                        components={{
                            Text: ({ text }) => <p className="whitespace-pre-wrap leading-relaxed">{text}</p>,
                        }}
                    />
                </div>
                <ActionBarPrimitive.Root className="mt-1 flex justify-end">
                    <ActionBarPrimitive.Copy
                        copiedDuration={1500}
                        className="h-6 rounded-md px-2 text-[11px] text-primary-foreground/80 hover:bg-primary/80 hover:text-primary-foreground data-[copied=true]:text-emerald-300"
                    >
                        Copy
                    </ActionBarPrimitive.Copy>
                </ActionBarPrimitive.Root>
            </div>
        </MessagePrimitive.Root>
    );
}

function AssistantMessage() {
    return (
        <MessagePrimitive.Root className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="max-w-[85%]">
                <div className="rounded-2xl rounded-tl-md bg-muted px-3 py-2 text-sm">
                    <MessagePrimitive.Content
                        components={{
                            Text: ({ text }) => (
                                <div className="aui-markdown prose prose-sm max-w-none text-foreground dark:prose-invert">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                        {text}
                                    </ReactMarkdown>
                                </div>
                            ),
                        }}
                    />
                </div>
                <ActionBarPrimitive.Root className="mt-1 flex">
                    <ActionBarPrimitive.Copy
                        copiedDuration={1500}
                        className="h-6 rounded-md px-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground data-[copied=true]:text-emerald-500"
                    >
                        Copy
                    </ActionBarPrimitive.Copy>
                </ActionBarPrimitive.Root>
            </div>
        </MessagePrimitive.Root>
    );
}

function SuggestionButtons({ suggestions }: { suggestions: string[] }) {
    const api = useAui();
    const isRunning = useAuiState((s) => s.thread.isRunning);

    const handleSuggestionClick = (suggestion: string) => {
        if (isRunning) return;
        api.thread().append({
            role: "user",
            content: [{ type: "text", text: suggestion }],
        });
    };

    return (
        <div className="mt-3 grid w-full max-w-[280px] gap-2">
            {suggestions.map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isRunning}
                    className="rounded-lg border bg-card px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
}

export function AssistantThread({
    title,
    subtitle,
    inputPlaceholder = "Ask anything...",
    suggestions,
    className,
}: AssistantThreadProps) {
    return (
        <ThreadPrimitive.Root className={cn("flex h-full min-h-0 flex-col", className)}>
            <ThreadPrimitive.Viewport className="flex-1 space-y-4 overflow-y-auto p-4">
                <AuiIf condition={({ thread }) => thread.isEmpty}>
                    <ThreadPrimitive.Empty>
                        <div className="flex h-full flex-col items-center justify-center text-center opacity-70">
                            <div className="mb-3 rounded-full bg-violet-100 p-3 dark:bg-violet-900/50">
                                <Bot className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                            </div>
                            <p className="text-sm font-medium">{title}</p>
                            <p className="mt-1 max-w-[280px] text-xs text-muted-foreground">{subtitle}</p>
                            {suggestions && suggestions.length > 0 && (
                                <SuggestionButtons suggestions={suggestions} />
                            )}
                        </div>
                    </ThreadPrimitive.Empty>
                </AuiIf>

                <AuiIf condition={({ thread }) => !thread.isEmpty}>
                    <ThreadPrimitive.Messages
                        components={{
                            UserMessage,
                            AssistantMessage,
                        }}
                    />
                </AuiIf>
            </ThreadPrimitive.Viewport>

            <div className="border-t bg-muted/20 p-3">
                <ComposerPrimitive.Root className="relative">
                    <ComposerPrimitive.Input
                        placeholder={inputPlaceholder}
                        className="max-h-40 w-full resize-none rounded-md border bg-background px-3 py-2 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <ComposerPrimitive.Send className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-md bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                        <Send className="h-4 w-4" />
                    </ComposerPrimitive.Send>
                </ComposerPrimitive.Root>
            </div>
        </ThreadPrimitive.Root>
    );
}
