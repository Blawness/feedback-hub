"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isAIEnabled, getAiConfig, getAiModel } from "@/lib/ai/gemini";
import { generateText } from "ai";

export type SavedIdeaInput = {
    title: string;
    description: string;
    category: string;
    techStack: string[];
    difficulty: string;
    audience: string;
    features: string[];
    contextPrompt?: string;
};

export type IdeaGenerationConfig = {
    count?: number;
    category?: string;
    difficulty?: string;
    techStackFocus?: string[];
    contextPrompt?: string;
};

export async function saveIdeaAction(idea: SavedIdeaInput) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return {
                error: "Unauthorized",
                status: 401,
            };
        }

        const savedIdea = await prisma.savedIdea.create({
            data: {
                ...idea,
                userId: user.id,
            },
        });

        revalidatePath("/idea-pool");

        return {
            success: true,
            data: savedIdea,
        };
    } catch (error) {
        console.error("Error saving idea:", error);
        return {
            error: "Failed to save idea",
            status: 500,
        };
    }
}

export async function getSavedIdeasAction() {
    try {
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return {
                error: "Unauthorized",
                status: 401,
            };
        }

        const savedIdeas = await prisma.savedIdea.findMany({
            where: {
                userId: user.id,
            },
            include: {
                prd: {
                    select: {
                        id: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            success: true,
            data: savedIdeas,
        };
    } catch (error) {
        console.error("Error fetching saved ideas:", error);
        return {
            error: "Failed to fetch saved ideas",
            status: 500,
        };
    }
}

export async function deleteSavedIdeaAction(ideaId: string) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return {
                error: "Unauthorized",
                status: 401,
            };
        }

        // Verify ownership
        const idea = await prisma.savedIdea.findUnique({
            where: { id: ideaId },
        });

        if (!idea || idea.userId !== user.id) {
            return {
                error: "Idea not found or unauthorized",
                status: 404,
            };
        }

        await prisma.savedIdea.delete({
            where: { id: ideaId },
        });

        revalidatePath("/idea-pool");

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error deleting idea:", error);
        return {
            error: "Failed to delete idea",
            status: 500,
        };
    }
}

export async function updateIdeaAction(ideaId: string, data: Partial<SavedIdeaInput>) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return {
                error: "Unauthorized",
                status: 401,
            };
        }

        // Verify ownership
        const idea = await prisma.savedIdea.findUnique({
            where: { id: ideaId },
        });

        if (!idea || idea.userId !== user.id) {
            return {
                error: "Idea not found or unauthorized",
                status: 404,
            };
        }

        const updatedIdea = await prisma.savedIdea.update({
            where: { id: ideaId },
            data,
        });

        revalidatePath("/idea-pool");

        return {
            success: true,
            data: updatedIdea,
        };
    } catch (error) {
        console.error("Error updating idea:", error);
        return {
            error: "Failed to update idea",
            status: 500,
        };
    }
}

export async function refineIdeaAction(idea: SavedIdeaInput, instruction: string) {
    if (!(await isAIEnabled())) {
        return { error: "AI is not available. Please configure your API key in AI Settings." };
    }

    try {
        const model = await getAiModel();
        if (!model) return { error: "AI model not available." };

        const systemInstruction = "You are an expert product architect. Your task is to refine or modify a software project idea based on specific user instructions. Keep the same JSON structure.";

        const prompt = `Original Idea:
${JSON.stringify(idea, null, 2)}

User Instruction for Refinement:
"${instruction}"

Output the refined idea strictly as a JSON object matching this structure:
{
  "title": "String",
  "category": "String",
  "techStack": ["String"],
  "description": "String",
  "difficulty": "String",
  "audience": "String",
  "features": ["String"]
}`;

        const { text } = await generateText({
            model,
            system: systemInstruction,
            prompt,
            temperature: 0.7,
        });

        if (!text?.trim()) return { error: "No response from AI." };

        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return { error: "AI response format was invalid." };

        const parsedIdea = JSON.parse(match[0]) as SavedIdeaInput;

        return {
            success: true,
            data: parsedIdea,
        };
    } catch (error) {
        console.error("AI Idea Refinement failed:", error);
        return {
            error: "Failed to refine idea with AI.",
            status: 500,
        };
    }
}

export async function generateIdeasAction(config: IdeaGenerationConfig = {}) {
    const { count = 3, category, difficulty, techStackFocus, contextPrompt } = config;

    if (!(await isAIEnabled())) {
        return { error: "AI is not available. Please configure your API key in AI Settings." };
    }

    try {
        const aiConfig = await getAiConfig();
        const model = await getAiModel();
        if (!model) return { error: "AI model not available. Please configure your API key in AI Settings." };

        // Force use the idea-generator template instruction if available, otherwise use a fallback
        const systemInstruction = aiConfig.systemInstruction ||
            "You are a creative technical product manager and software architect. Your task is to generate innovative and practical software project ideas. For each idea, you must provide a catchy Title, a Category (e.g., SaaS, Landing Page, Web App, Mobile App, CLI Tool, Browser Extension), a recommended Tech Stack (as an array of strings), a detailed 1-2 paragraph Description, a Difficulty Level (Beginner, Intermediate, Advanced), a Target Audience description, and a list of 3-5 Key Features. Ensure ideas represent modern, in-demand technologies and solve real problems.";

        let constraints = "";
        if (category) constraints += `- Category: ${category}\n`;
        if (difficulty) constraints += `- Difficulty Level: ${difficulty}\n`;
        if (techStackFocus && techStackFocus.length > 0) constraints += `- Tech Stack Focus: ${techStackFocus.join(", ")}\n`;

        let userContext = "";
        if (contextPrompt?.trim()) {
            userContext = `\n\nUser Context / Initial Prompt:\n"${contextPrompt.trim()}"\n\nUse the above context to tailor the generated ideas to the user's needs, niche, and preferences.`;
        }

        const prompt = `Generate exactly ${count} unique software project ideas. ${constraints ? `Ensure the ideas follow these specific constraints:\n${constraints}\n` : ""}${userContext}

Return the result strictly as a JSON array of objects, where each object matches this structure:
{
  "title": "String",
  "category": "String",
  "techStack": ["String"],
  "description": "String",
  "difficulty": "String",
  "audience": "String",
  "features": ["String"]
}`;

        const { text } = await generateText({
            model,
            system: systemInstruction,
            prompt,
            temperature: 0.9, // Higher temperature for more creative ideas
            // @ts-ignore: maxTokens is not typed correctly in this ai version
            maxTokens: aiConfig.maxOutputTokens,
        });

        if (!text?.trim()) return { error: "No response from AI." };

        // Match everything from the first '[' to the last ']' to ensure pure JSON
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) return { error: "AI response format was invalid." };

        const cleaned = match[0];
        const parsedIdeas = JSON.parse(cleaned) as SavedIdeaInput[];

        return {
            success: true,
            data: parsedIdeas,
        };
    } catch (error) {
        console.error("AI Idea Generation failed:", error);
        return {
            error: "Failed to generate ideas. Please try again.",
            status: 500,
        };
    }
}

export async function generatePrdAction(ideaId: string) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return { error: "Unauthorized", status: 401 };
        }

        const idea = await prisma.savedIdea.findUnique({
            where: { id: ideaId },
        });

        if (!idea || idea.userId !== user.id) {
            return { error: "Idea not found or unauthorized", status: 404 };
        }

        if (!(await isAIEnabled())) {
            return { error: "AI is not available. Please configure your API key in AI Settings." };
        }

        const model = await getAiModel();
        if (!model) return { error: "AI model not available. Please configure your API key in AI Settings." };

        const systemInstruction = `You are an expert product manager and technical writer. Your task is to generate a comprehensive Product Requirements Document (PRD) in Markdown format. The PRD should be professional, detailed, and ready to use as a planning document for development.`;

        const contextSection = idea.contextPrompt
            ? `\n\nUser's Initial Context:\n"${idea.contextPrompt}"`
            : "";

        const prompt = `Generate a complete PRD (Product Requirements Document) in Markdown format for the following product idea:

Title: ${idea.title}
Category: ${idea.category}
Description: ${idea.description}
Target Audience: ${idea.audience}
Difficulty: ${idea.difficulty}
Tech Stack: ${idea.techStack.join(", ")}
Key Features: ${idea.features.join(", ")}${contextSection}

The PRD should include the following sections:
1. **Overview** — Product vision and summary
2. **Problem Statement** — What problem does this solve?
3. **Goals & Objectives** — Key goals and success metrics
4. **Target Users** — User personas and audience
5. **Functional Requirements** — Detailed feature list with user stories
6. **Non-Functional Requirements** — Performance, security, scalability
7. **Tech Stack & Architecture** — Recommended technologies and high-level architecture
8. **User Flow** — Key user journeys
9. **Milestones & Timeline** — Phased development plan
10. **Risks & Mitigations** — Potential challenges
11. **Success Metrics** — KPIs and how to measure success

Output the PRD in clean Markdown format. Be detailed and thorough.`;

        const { text } = await generateText({
            model,
            system: systemInstruction,
            prompt,
            temperature: 0.7,
            // @ts-ignore
            maxTokens: 4096,
        });

        if (!text?.trim()) return { error: "No response from AI." };

        // Upsert the PRD
        const prd = await prisma.ideaPrd.upsert({
            where: { ideaId },
            update: { content: text.trim() },
            create: { ideaId, content: text.trim() },
        });

        revalidatePath("/idea-pool");

        return {
            success: true,
            data: prd,
        };
    } catch (error) {
        console.error("PRD Generation failed:", error);
        return {
            error: "Failed to generate PRD. Please try again.",
            status: 500,
        };
    }
}

export async function getPrdAction(ideaId: string) {
    try {
        const user = await getCurrentUser();

        if (!user || !user.id) {
            return { error: "Unauthorized", status: 401 };
        }

        const idea = await prisma.savedIdea.findUnique({
            where: { id: ideaId },
        });

        if (!idea || idea.userId !== user.id) {
            return { error: "Idea not found or unauthorized", status: 404 };
        }

        const prd = await prisma.ideaPrd.findUnique({
            where: { ideaId },
        });

        return {
            success: true,
            data: prd,
        };
    } catch (error) {
        console.error("Error fetching PRD:", error);
        return {
            error: "Failed to fetch PRD",
            status: 500,
        };
    }
}
