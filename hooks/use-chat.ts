"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { getChatHistory, saveChatMessage, clearChatHistory } from "@/lib/actions/chat";

interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
    createdAt?: string;
}

interface UseChatSessionOptions {
    taskId?: string;
    projectId?: string;
    /** Optional: Server action for legacy non-streaming chat */
    onSendMessage?: (
        message: string,
        history: { role: "user" | "assistant"; content: string }[]
    ) => Promise<{ reply?: string; error?: string }>;
    /** Optional: API endpoint for streaming chat */
    apiEndpoint?: string;
}

export function useChatSession({ taskId, projectId, onSendMessage, apiEndpoint }: UseChatSessionOptions) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isSending, startTransition] = useTransition();
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Load history on mount
    useEffect(() => {
        let cancelled = false;

        async function loadHistory() {
            setIsLoadingHistory(true);
            const result = await getChatHistory({ taskId, projectId });
            if (!cancelled && result.messages) {
                setMessages(result.messages);
            }
            if (!cancelled) setIsLoadingHistory(false);
        }

        loadHistory();
        return () => { cancelled = true; };
    }, [taskId, projectId]);

    const handleSend = useCallback(
        async function handleSend(overrideMessage?: string) {
            const text = (overrideMessage || input).trim();
            if (!text || isSending) return;

            const userMessage: Message = { role: "user", content: text };
            setMessages((prev) => [...prev, userMessage]);
            if (!overrideMessage) setInput("");

            if (apiEndpoint) {
                // ─── STREAMING PATH ──────────────────────────────────────────
                // Optimistically add assistant message placeholder
                setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

                startTransition(async () => {
                    try {
                        const response = await fetch(apiEndpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                message: text,
                                history: messages.map(m => ({ role: m.role, content: m.content })),
                                context: { taskId, projectId }
                            }),
                        });

                        if (!response.ok || !response.body) {
                            throw new Error("Failed to send message");
                        }

                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        let done = false;
                        let accumulatedContent = "";

                        while (!done) {
                            const { value, done: doneReading } = await reader.read();
                            done = doneReading;
                            const chunkValue = decoder.decode(value, { stream: !done });
                            accumulatedContent += chunkValue;

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                const lastMsg = newMessages[newMessages.length - 1];
                                if (lastMsg.role === "assistant") {
                                    lastMsg.content = accumulatedContent;
                                }
                                return newMessages;
                            });
                        }
                    } catch (error) {
                        console.error("Streaming error:", error);
                        setMessages((prev) => {
                            const newMessages = [...prev];
                            const lastMsg = newMessages[newMessages.length - 1];
                            if (lastMsg.role === "assistant") {
                                lastMsg.content = "⚠️ Error: Failed to get response.";
                            }
                            return newMessages;
                        });
                    }
                });

            } else if (onSendMessage) {
                // ─── LEGACY SERVER ACTION PATH ─────────────────────────────
                startTransition(async () => {
                    // Save user message to DB
                    await saveChatMessage({
                        role: "user",
                        content: text,
                        taskId,
                        projectId,
                    });

                    // Get AI response
                    const history = [...messages, userMessage].map((m) => ({
                        role: m.role,
                        content: m.content,
                    }));

                    const result = await onSendMessage(text, history);

                    const assistantContent = result.error
                        ? `⚠️ ${result.error}`
                        : result.reply || "No response.";

                    const assistantMessage: Message = {
                        role: "assistant",
                        content: assistantContent,
                    };

                    setMessages((prev) => [...prev, assistantMessage]);

                    // Save assistant message to DB
                    await saveChatMessage({
                        role: "assistant",
                        content: assistantContent,
                        taskId,
                        projectId,
                    });
                });
            }
        },
        [input, isSending, messages, onSendMessage, apiEndpoint, taskId, projectId, startTransition]
    );

    const handleKeyDown = useCallback(
        function handleKeyDown(e: React.KeyboardEvent) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const handleClear = useCallback(
        async function handleClear() {
            if (confirm("Are you sure you want to clear the chat history?")) {
                await clearChatHistory({ taskId, projectId });
                setMessages([]);
            }
        },
        [taskId, projectId]
    );

    return {
        messages,
        input,
        setInput,
        isSending,
        isLoadingHistory,
        messagesEndRef,
        inputRef,
        handleSend,
        handleKeyDown,
        handleClear,
    };
}
