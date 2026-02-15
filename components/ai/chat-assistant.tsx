"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MessageCircle,
    X,
    Send,
    Sparkles,
    Bot,
    User,
    Minimize2,
} from "lucide-react";
import { chatWithAssistant } from "@/lib/actions/ai";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isSending, startTransition] = useTransition();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

    function handleSend() {
        const trimmed = input.trim();
        if (!trimmed || isSending) return;

        const userMessage: Message = { role: "user", content: trimmed };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        startTransition(async () => {
            const result = await chatWithAssistant(
                trimmed,
                undefined,
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

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 p-0 z-50"
            >
                <MessageCircle className="h-6 w-6 text-white" />
            </Button>
        );
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="h-14 rounded-full shadow-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-5 gap-2"
                >
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="text-white text-sm">AI Chat</span>
                    {messages.length > 0 && (
                        <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {messages.length}
                        </span>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] rounded-2xl shadow-2xl border bg-background flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        onClick={() => setIsMinimized(true)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <Minimize2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        onClick={() => setIsOpen(false)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <Bot className="h-10 w-10 text-violet-400" />
                        <div>
                            <p className="text-sm font-medium">Feedback Hub AI</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Ask me about your feedbacks, tasks, or project insights
                            </p>
                        </div>
                        <div className="space-y-1.5 w-full max-w-[250px]">
                            {[
                                "How many open bugs?",
                                "What's the most urgent feedback?",
                                "Summary of recent feedback",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        inputRef.current?.focus();
                                    }}
                                    className="block w-full text-left text-xs px-3 py-1.5 rounded-lg border hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors"
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
                        className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300"
                                }`}
                        >
                            {msg.role === "user" ? (
                                <User className="h-3.5 w-3.5" />
                            ) : (
                                <Bot className="h-3.5 w-3.5" />
                            )}
                        </div>
                        <div
                            className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-md"
                                    : "bg-muted rounded-tl-md"
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {isSending && (
                    <div className="flex gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                            <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="rounded-2xl rounded-tl-md bg-muted px-3 py-2">
                            <div className="flex gap-1">
                                <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" />
                                <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.1s]" />
                                <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your feedbacks..."
                        disabled={isSending}
                        className="text-sm"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !input.trim()}
                        size="sm"
                        className="px-3 bg-violet-600 hover:bg-violet-700"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
