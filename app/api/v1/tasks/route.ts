import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey) {
            return NextResponse.json(
                { error: "Unauthorized. Missing API key." },
                { status: 401 }
            );
        }

        const project = await prisma.project.findUnique({
            where: { apiKey, isActive: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Unauthorized. Invalid API key." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, description, priority, dueDate, feedbackId } = body;

        if (!title) {
            return NextResponse.json(
                { error: "title is required." },
                { status: 400 }
            );
        }

        const task = await prisma.task.create({
            data: {
                title,
                description: description || null,
                priority: priority || "medium",
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: project.id,
                feedbackId: feedbackId || null,
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("Failed to create task:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey) {
            return NextResponse.json(
                { error: "Unauthorized. Missing API key." },
                { status: 401 }
            );
        }

        const project = await prisma.project.findUnique({
            where: { apiKey, isActive: true },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Unauthorized. Invalid API key." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const tasks = await prisma.task.findMany({
            where: {
                projectId: project.id,
                ...(status ? { status } : {}),
            },
            orderBy: { createdAt: "desc" },
            include: {
                assignee: { select: { id: true, name: true } },
                feedback: { select: { id: true, title: true } },
            },
        });

        return NextResponse.json({ data: tasks });
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
