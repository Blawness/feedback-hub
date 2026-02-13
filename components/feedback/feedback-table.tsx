"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface FeedbackTableProps {
    title?: string;
    limit?: number;
}

// Mock data for now
const feedbacks = [
    {
        id: "fb-1",
        title: "Login page crashing on mobile",
        project: "harun-lawfirm",
        status: "open",
        priority: "high",
        createdAt: "2024-02-13",
    },
    {
        id: "fb-2",
        title: "Add export to CSV feature",
        project: "next-absen",
        status: "in_progress",
        priority: "medium",
        createdAt: "2024-02-12",
    },
    {
        id: "fb-3",
        title: "Typos in about us page",
        project: "finedu",
        status: "resolved",
        priority: "low",
        createdAt: "2024-02-10",
    },
];

export function FeedbackTable({ title = "Feedback", limit }: FeedbackTableProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/feedback">
                        View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedbacks.map((fb) => (
                            <TableRow key={fb.id}>
                                <TableCell className="font-medium">{fb.title}</TableCell>
                                <TableCell>{fb.project}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            fb.status === "open"
                                                ? "destructive"
                                                : fb.status === "in_progress"
                                                    ? "default"
                                                    : "secondary"
                                        }
                                    >
                                        {fb.status.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{fb.priority}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
