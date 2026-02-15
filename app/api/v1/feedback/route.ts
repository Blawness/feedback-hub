import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getProjectByApiKey(request: Request) {
    const apiKey = request.headers.get("X-API-Key");
    if (!apiKey) return null;

    const project = await prisma.project.findUnique({
        where: { apiKey, isActive: true },
    });
    return project;
}

export async function POST(request: Request) {
    try {
        const project = await getProjectByApiKey(request);
        if (!project) {
            return NextResponse.json(
                { error: "Unauthorized. Invalid or missing API key." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, description, type, priority, metadata } = body;

        if (!title || !description) {
            return NextResponse.json(
                { error: "title and description are required." },
                { status: 400 }
            );
        }

        const feedback = await prisma.feedback.create({
            data: {
                title,
                description,
                type: type || "bug",
                priority: priority || "medium",
                source: "api",
                metadata: metadata || undefined,
                projectId: project.id,
            },
        });

        return NextResponse.json(feedback, { status: 201 });
    } catch (error) {
        console.error("Failed to create feedback:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const project = await getProjectByApiKey(request);
        if (!project) {
            return NextResponse.json(
                { error: "Unauthorized. Invalid or missing API key." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const feedbacks = await prisma.feedback.findMany({
            where: {
                projectId: project.id,
                ...(status ? { status } : {}),
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                _count: { select: { comments: true } },
            },
        });

        const total = await prisma.feedback.count({
            where: {
                projectId: project.id,
                ...(status ? { status } : {}),
            },
        });

        return NextResponse.json({ data: feedbacks, total, page, limit });
    } catch (error) {
        console.error("Failed to fetch feedbacks:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
