"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    MessageCircle,
    X,
    Send,
    Sparkles,
    Minimize2,
    Trash2,
    Plus,
    Maximize2,
    GripHorizontal
} from "lucide-react";
import { chatWithAssistant } from "@/lib/actions/ai";
import { useChatSession } from "@/hooks/use-chat";
import { ChatMessage, TypingIndicator } from "./chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Resizable height state
    const [height, setHeight] = useState(500);
    const isResizingRef = useRef(false);

    const {
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
    } = useChatSession({
        apiEndpoint: "/api/chat",
    });

    useEffect(() => {
        if (isOpen && !isMinimized) {
            // Small delay to allow animation
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized, inputRef]);

    // Resize handlers
    const startResizing = (e: React.MouseEvent) => {
        isResizingRef.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", stopResizing);
        e.preventDefault(); // Prevent text selection
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizingRef.current) return;
        const newHeight = window.innerHeight - e.clientY - 24; // 24px bottom margin
        if (newHeight > 300 && newHeight < window.innerHeight - 100) {
            setHeight(newHeight);
        }
    };

    const stopResizing = () => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResizing);
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 p-0 z-50 animate-in zoom-in duration-300"
            >
                <MessageCircle className="h-6 w-6 text-white" />
                <span className="sr-only">Open AI Chat</span>
            </Button>
        );
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="h-14 rounded-full shadow-xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-5 gap-2"
                >
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    <span className="text-white text-sm font-medium">AI Chat</span>
                    {messages.length > 0 && (
                        <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {messages.length}
                        </span>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "fixed bottom-6 right-6 w-[400px] bg-background border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 ease-in-out font-sans",
                isExpanded ? "w-[600px] right-1/2 translate-x-1/2 bottom-[10vh] h-[80vh] !translate-y-0" : ""
            )}
            style={{ height: isExpanded ? "80vh" : `${height}px` }}
        >
            {/* Resizer Handle (only when not expanded) */}
            {!isExpanded && (
                <div
                    className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-50 hover:bg-violet-500/20 transition-colors"
                    onMouseDown={startResizing}
                />
            )}

            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white shrink-0 cursor-move"
                onDoubleClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm leading-none">AI Assistant</h3>
                        <p className="text-[10px] text-white/80 font-medium mt-0.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClear}
                                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Clear History</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>{isExpanded ? "Shrink" : "Expand"}</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMinimized(true)}
                                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <GripHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Minimize</p></TooltipContent>
                        </Tooltip>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-7 w-7 text-white/70 hover:text-white hover:bg-red-500/80 rounded-full ml-1"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </TooltipProvider>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 bg-muted/5 p-4">
                <div className="space-y-6 pb-2">
                    {messages.length === 0 && !isLoadingHistory && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4 opacity-100 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-violet-100 dark:bg-violet-900/30 p-4 rounded-full shadow-sm">
                                <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-semibold">How can I help you?</h4>
                                <p className="text-xs text-muted-foreground max-w-[220px] mx-auto">
                                    I can analyze feedback, suggest tasks, and answer questions about your project.
                                </p>
                            </div>
                            <div className="grid gap-2 w-full max-w-[260px]">
                                {[
                                    "Summarize recent high-priority bugs",
                                    "What is the status of task #123?",
                                    "Draft a response for the latest feedback"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleSend(suggestion)}
                                        className="text-xs py-2.5 px-3 rounded-xl border bg-card hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-200 dark:hover:border-violet-800 hover:text-violet-700 dark:hover:text-violet-300 transition-all text-left shadow-sm hover:shadow-md"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isLoadingHistory && (
                        <div className="flex justify-center py-4">
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse mx-0.5"></span>
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse mx-0.5 [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse mx-0.5 [animation-delay:0.4s]"></span>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <ChatMessage
                            key={msg.id || i}
                            role={msg.role}
                            content={msg.content}
                        />
                    ))}

                    {isSending && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 bg-background border-t shrink-0">
                <div className="relative rounded-2xl bg-muted/40 border focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 transition-all">
                    <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isSending}
                        rows={1}
                        className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent py-3 pl-4 pr-12 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                        style={{ height: input ? `${Math.min(input.split('\n').length * 20 + 24, 120)}px` : '44px' }}
                    />
                    <div className="absolute right-1.5 bottom-1.5">
                        <Button
                            onClick={() => handleSend()}
                            disabled={isSending || !input.trim()}
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-200",
                                input.trim()
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            <Send className="h-3.5 w-3.5 ml-0.5" />
                        </Button>
                    </div>
                </div>
                <div className="text-[10px] text-center text-muted-foreground mt-2 opacity-60">
                    AI can make mistakes. Please verify important information.
                </div>
            </div>
        </div>
    );
}
