"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProjectAnalytics, ProjectAnalytics } from "@/lib/actions/analytics";
import { getProjects } from "@/lib/actions/projects";
import { SentimentChart } from "@/components/dashboard/sentiment-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InsightsPage() {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const allProjects = await getProjects();
      setProjects(allProjects);
      if (allProjects.length > 0) {
        setSelectedProjectId(allProjects[0].id);
      } else {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      if (!selectedProjectId) return;
      setLoading(true);
      try {
        const data = await getProjectAnalytics(selectedProjectId);
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedProjectId]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Insights Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[100px]" /> : (
              <div className="text-2xl font-bold">
                {analytics?.averageSentiment.toFixed(2) || "0.00"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Across all feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-[100px]" /> : (
              <div className="text-2xl font-bold">{analytics?.totalFeedback || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Received total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sentiment Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? <Skeleton className="h-[350px] w-full" /> : (
              analytics && <TrendChart data={analytics.volumeTrend} />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Feedback Distribution</CardTitle>
            <CardDescription>By sentiment category</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-[350px] w-full" /> : (
              analytics && <SentimentChart data={analytics.sentimentDistribution} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
