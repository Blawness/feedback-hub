export interface FeedbackAnalysis {
    suggestedTitle?: string;
    suggestedDescription?: string;
    suggestedAgentPrompt?: string;
    suggestedType: "bug" | "feature" | "improvement" | "question";
    suggestedPriority: "low" | "medium" | "high" | "critical";
    summary: string;
    confidence: number; // 0-1
}

export interface SuggestedReply {
    reply: string;
    tone: "professional" | "friendly" | "technical";
}

export interface DashboardInsight {
    title: string;
    description: string;
    category: "trend" | "alert" | "suggestion";
    relatedFeedbackIds?: string[];
}

export interface TaskSuggestion {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    suggestedDueDate?: string; // ISO date string
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface SemanticSearchResult {
    feedbackId: string;
    relevanceScore: number;
    reason: string;
}
