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
import { format } from "date-fns";

interface Feedback {
    id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    createdAt: Date;
    project: { name: string };
}

export function RecentFeedbackTable({ feedbacks }: { feedbacks: Feedback[] }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Feedback</CardTitle>
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
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedbacks.map((fb) => (
                            <TableRow key={fb.id}>
                                <TableCell>
                                    <Link href={`/feedback/${fb.id}`} className="font-medium hover:underline">
                                        {fb.title}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{fb.project.name}</Badge>
                                </TableCell>
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
                                <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(fb.createdAt), "MMM d")}
                                </TableCell>
                            </TableRow>
                        ))}
                        {feedbacks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No feedback yet. Sync projects and use the API to submit feedback.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
