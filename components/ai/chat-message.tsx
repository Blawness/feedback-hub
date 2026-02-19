"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Bot, User, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ChatActionButtons } from "@/components/ai/chat-action-buttons";
import { ChatActionHint } from "@/lib/ai/types";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
    actions?: React.ReactNode;
    taskId?: string; // Need taskId for actions
}

export function ChatMessage({ role, content, isStreaming, actions, taskId }: ChatMessageProps) {
    const isUser = role === "user";

    // Extract actions from content if not user
    const { cleanContent, extractedActions } = isUser
        ? { cleanContent: content, extractedActions: [] }
        : extractActions(content);

    return (
        <div className={cn("flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300", isUser && "flex-row-reverse")}>
            {/* Avatar */}
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300"
                )}
            >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div
                className={cn(
                    "group relative rounded-2xl px-4 py-2.5 text-sm max-w-[85%] shadow-sm",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                )}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                pre({ children, ...props }) {
                                    return (
                                        <div className="relative group/code">
                                            <CopyCodeButton content={extractCodeContent(children)} />
                                            <pre {...props} className="rounded-lg !bg-zinc-950 dark:!bg-zinc-900 !text-zinc-50 p-3 text-xs overflow-x-auto">
                                                {children}
                                            </pre>
                                        </div>
                                    );
                                },
                                code({ children, className, ...props }) {
                                    const isInline = !className;
                                    if (isInline) {
                                        return (
                                            <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 text-xs font-mono" {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                    return <code className={className} {...props}>{children}</code>;
                                },
                                a({ children, href, ...props }) {
                                    return (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline underline-offset-2 hover:text-violet-700" {...props}>
                                            {children}
                                        </a>
                                    );
                                },
                                table({ children, ...props }) {
                                    return (
                                        <div className="overflow-x-auto my-2">
                                            <table className="min-w-full text-xs" {...props}>{children}</table>
                                        </div>
                                    );
                                },
                            }}
                        >
                            {cleanContent}
                        </ReactMarkdown>
                        {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse rounded-sm ml-0.5" />
                        )}
                    </div>
                )}

                {/* Copy message button for assistant */}
                {!isUser && !isStreaming && (
                    <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <CopyMessageButton text={cleanContent} />
                    </div>
                )}

                {/* Parsed Action buttons */}
                {extractedActions.length > 0 && !isStreaming && (
                    <ChatActionButtons actions={extractedActions} taskId={taskId} />
                )}

                {/* Explicit Action buttons (props) */}
                {actions && !isStreaming && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

function extractActions(text: string): { cleanContent: string; extractedActions: ChatActionHint[] } {
    const actionRegex = /<!--\s*action:({.*?})\s*-->/g;
    const extractedActions: ChatActionHint[] = [];
    let cleanContent = text;

    let match;
    while ((match = actionRegex.exec(text)) !== null) {
        try {
            const actionJson = JSON.parse(match[1]);
            extractedActions.push(actionJson);
        } catch (e) {
            console.error("Failed to parse action JSON:", e);
        }
    }

    cleanContent = text.replace(actionRegex, "").trim();
    return { cleanContent, extractedActions };
}
// ─── Typing Indicator ────────────────────────────────────────

export function TypingIndicator() {
    return (
        <div className="flex gap-3 animate-in fade-in-0 duration-300">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300">
                <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <div className="flex gap-1.5 items-center h-4">
                    <span className="h-2 w-2 rounded-full bg-violet-400/70 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-violet-400/70 animate-bounce [animation-delay:0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-violet-400/70 animate-bounce [animation-delay:0.3s]" />
                </div>
            </div>
        </div>
    );
}

// ─── Internal Helpers ────────────────────────────────────────

function CopyMessageButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
        >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
        </Button>
    );
}

function CopyCodeButton({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);

    return (
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/code:opacity-100 transition-opacity bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md z-10"
            onClick={() => {
                navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
        >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </Button>
    );
}

function extractCodeContent(children: React.ReactNode): string {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.map(extractCodeContent).join("");
    if (children && typeof children === "object" && "props" in children) {
        const props = (children as React.ReactElement).props as { children?: React.ReactNode };
        return extractCodeContent(props.children);
    }
    return "";
}
