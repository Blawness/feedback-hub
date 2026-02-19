"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    Copy,
    Check
} from "lucide-react";
import { chatWithTaskAssistant } from "@/lib/actions/ai";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface TaskAIChatProps {
    taskId: string;
    taskTitle: string;
}

export function TaskAIChat({ taskId, taskTitle }: TaskAIChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isSending, startTransition] = useTransition();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    function handleSend() {
        const trimmed = input.trim();
        if (!trimmed || isSending) return;

        const userMessage: Message = { role: "user", content: trimmed };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        startTransition(async () => {
            const result = await chatWithTaskAssistant(
                taskId,
                trimmed,
                messages
            );

            if (result.error) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: `⚠️ ${result.error}` },
                ]);
            } else if (result.reply) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: result.reply! },
                ]);
            }
        });
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    return (
        <div className="flex flex-col h-full w-full border rounded-md overflow-hidden bg-background min-h-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0 w-full">
                <div className="p-4 space-y-4 pb-10">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3 opacity-60">
                            <div className="bg-violet-100 dark:bg-violet-900/50 p-3 rounded-full">
                                <Bot className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Task Assistant</p>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                                    I have context about <strong>"{taskTitle}"</strong>. Ask me anything!
                                </p>
                            </div>
                            <div className="grid gap-2 w-full max-w-[280px]">
                                {[
                                    "Summarize this task",
                                    "Suggest implementation steps",
                                    "Draft a status update"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            if (isSending) return;
                                            const userMessage: Message = { role: "user", content: suggestion };
                                            setMessages(prev => [...prev, userMessage]);

                                            startTransition(async () => {
                                                const result = await chatWithTaskAssistant(taskId, suggestion, []);
                                                if (result.reply) {
                                                    setMessages(prev => [...prev, { role: "assistant", content: result.reply! }]);
                                                }
                                            });
                                        }}
                                        className="text-xs py-2 px-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                                    }`}
                            >
                                {msg.role === "user" ? (
                                    <User className="h-4 w-4" />
                                ) : (
                                    <Bot className="h-4 w-4" />
                                )}
                            </div>
                            <div
                                className={`group relative rounded-xl px-4 py-2 text-sm max-w-[85%] shadow-sm ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-muted rounded-tl-sm"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                {msg.role === "assistant" && (
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CopyButton text={msg.content} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isSending && (
                        <div className="flex gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                            <div className="rounded-xl rounded-tl-sm bg-muted px-4 py-2">
                                <div className="flex gap-1 items-center h-5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.1s]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:0.2s]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 bg-muted/20 border-t">
                <div className="relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask specifically about this task..."
                        disabled={isSending}
                        className="pr-10 bg-background"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !input.trim()}
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0 bg-violet-600 hover:bg-violet-700 text-white rounded-md"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/20 rounded-md"
            onClick={handleCopy}
            title="Copy message"
        >
            {copied ? (
                <Check className="h-3 w-3 text-green-500" />
            ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
            )}
        </Button>
    );
}
