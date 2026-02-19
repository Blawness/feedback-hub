"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, Sparkles, Trash2, ListTodo, FileText, Lightbulb } from "lucide-react";
import { chatWithTaskAssistant } from "@/lib/actions/ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatSession } from "@/hooks/use-chat";
import { ChatMessage, TypingIndicator } from "@/components/ai/chat-message";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskAIChatProps {
    taskId: string;
    taskTitle: string;
}

export function TaskAIChat({ taskId, taskTitle }: TaskAIChatProps) {
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
        taskId,
        apiEndpoint: "/api/chat",
    });

    return (
        <div className="flex flex-col h-full w-full bg-background min-h-0 relative">
            {/* Toolbar */}
            <div className="absolute top-2 right-4 z-10">
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                                disabled={messages.length === 0}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Clear chat history</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0 w-full">
                <div className="p-4 space-y-6 pb-10">
                    {messages.length === 0 && !isLoadingHistory && (
                        <div className="flex flex-col items-center justify-center h-[280px] text-center space-y-4 opacity-100 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-violet-100 dark:bg-violet-900/30 p-4 rounded-full shadow-sm mb-2">
                                <Bot className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-base font-semibold">Task Assistant</h4>
                                <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto leading-relaxed">
                                    I have full context about <strong>"{taskTitle}"</strong>.
                                    <br />
                                    How can I help you move this forward?
                                </p>
                            </div>

                            <div className="grid gap-2 w-full max-w-[320px] text-left">
                                <SuggestionButton
                                    icon={<ListTodo className="h-3.5 w-3.5 text-blue-500" />}
                                    label="Break down into subtasks"
                                    onClick={() => handleSend("Break this task down into smaller actionable steps")}
                                />
                                <SuggestionButton
                                    icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
                                    label="Suggest technical implementation"
                                    onClick={() => handleSend("Suggest a technical implementation approach for this task")}
                                />
                                <SuggestionButton
                                    icon={<FileText className="h-3.5 w-3.5 text-green-500" />}
                                    label="Draft a status update"
                                    onClick={() => handleSend("Draft a professional status update for this task")}
                                />
                            </div>
                        </div>
                    )}

                    {isLoadingHistory && (
                        <div className="flex justify-center py-10">
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
            <div className="p-3 bg-muted/20 border-t shrink-0">
                <div className="relative bg-background rounded-xl border focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 transition-all shadow-sm">
                    <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Ask specifically about "${taskTitle}"...`}
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
                                "h-8 w-8 rounded-lg transition-all duration-200",
                                input.trim()
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            <Send className="h-3.5 w-3.5 ml-0.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuggestionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-3 w-full p-2.5 rounded-xl border bg-card hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-200"
        >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted group-hover:bg-white dark:group-hover:bg-violet-900/40 transition-colors">
                {icon}
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {label}
            </span>
        </button>
    )
}
