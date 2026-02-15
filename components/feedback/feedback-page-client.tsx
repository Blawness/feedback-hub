"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";

import { FeedbackWithRelations } from "@/lib/actions/feedback";

interface FeedbackItem {
    id: string;
    title: string;
    description: string;
    type: string;
    priority: string;
    status: string;
    source: string;
    createdAt: Date;
    project: { id: string; name: string; slug: string };
    assignee: { id: string; name: string; email: string } | null;
    _count: { comments: number; tasks: number };
    updatedAt: Date;
    metadata: any;
    projectId: string;
    assigneeId: string | null;
}

interface Project {
    id: string;
    name: string;
    slug: string;
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    OPEN: "destructive",
    IN_PROGRESS: "default",
    RESOLVED: "secondary",
    CLOSED: "outline",
    // Add lowercase mappings just in case
    open: "destructive",
    in_progress: "default",
    resolved: "secondary",
    closed: "outline",
};

const PRIORITY_COLORS: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function FeedbackPageClient({
    feedbacks,
    projects,
    total,
    currentPage,
    filters,
}: {
    feedbacks: FeedbackItem[];
    projects: Project[];
    total: number;
    currentPage: number;
    filters: {
        status?: string;
        projectId?: string;
        priority?: string;
        search?: string;
    };
}) {
    const router = useRouter();
    const params = useSearchParams();
    const [searchValue, setSearchValue] = useState(filters.search || "");
    const totalPages = Math.ceil(total / 20);

    function updateFilter(key: string, value: string) {
        const newParams = new URLSearchParams(params.toString());
        if (value && value !== "all") {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.delete("page");
        router.push(`/feedback?${newParams.toString()}`);
    }

    function handleSearch() {
        updateFilter("search", searchValue);
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search feedback..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={filters.status || "all"}
                            onValueChange={(v) => updateFilter("status", v)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.priority || "all"}
                            onValueChange={(v) => updateFilter("priority", v)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.projectId || "all"}
                            onValueChange={(v) => updateFilter("projectId", v)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feedbacks.map((fb) => (
                                <TableRow key={fb.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>
                                        <Link
                                            href={`/feedback/${fb.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {fb.title}
                                        </Link>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {fb._count.comments} comments · {fb._count.tasks} tasks
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{fb.project.name}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{fb.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_COLORS[fb.status] || "outline"}>
                                            {fb.status.replace("_", " ")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${PRIORITY_COLORS[fb.priority] || ""}`}
                                        >
                                            {fb.priority}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(fb.createdAt), "MMM d, yyyy")}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {feedbacks.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No feedback found. Adjust filters or submit feedback via API.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => {
                                const p = new URLSearchParams(params.toString());
                                p.set("page", String(currentPage - 1));
                                router.push(`/feedback?${p.toString()}`);
                            }}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => {
                                const p = new URLSearchParams(params.toString());
                                p.set("page", String(currentPage + 1));
                                router.push(`/feedback?${p.toString()}`);
                            }}
                        >
                            Next <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
