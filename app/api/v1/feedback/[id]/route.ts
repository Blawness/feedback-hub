import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const body = await request.json();
        const { status, priority, assigneeId } = body;

        const feedback = await prisma.feedback.findFirst({
            where: { id, projectId: project.id },
        });

        if (!feedback) {
            return NextResponse.json(
                { error: "Feedback not found." },
                { status: 404 }
            );
        }

        const updated = await prisma.feedback.update({
            where: { id },
            data: {
                ...(status ? { status } : {}),
                ...(priority ? { priority } : {}),
                ...(assigneeId !== undefined ? { assigneeId } : {}),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update feedback:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
