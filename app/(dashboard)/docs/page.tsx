import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { type Metadata } from "next";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CopyButton } from "@/components/copy-button";

export const metadata: Metadata = {
    title: "API Documentation | Feedback Hub",
    description: "Learn how to integrate Feedback Hub into your applications.",
};

const BASE_URL = "https://feedback-hub-seven.vercel.app";

export default function DocsPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">API Documentation</h2>
                <p className="text-muted-foreground mt-2">
                    Integrate Feedback Hub directly into your applications to collect feedback and bug reports programmatically.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>
                        All API requests must be authenticated using your Project API Key.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm">
                        Include your API key in the <code className="text-primary font-medium">FEEDBACK_API_KEY</code> header of your requests.
                        You can find your API Key in the <strong>Projects</strong> settings.
                    </p>
                    <div className="rounded-md bg-muted p-4">
                        <div className="flex items-center gap-2 font-mono text-sm text-foreground">
                            <span className="text-blue-500">FEEDBACK_API_KEY:</span>
                            <span>&lt;your-project-api-key&gt;</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10">
                <CardHeader>
                    <CardTitle className="text-blue-700 dark:text-blue-400">🤖 Quick Setup with AI</CardTitle>
                    <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                        Copy this prompt and give it to your AI Coding Assistant (Cursor, Windsurf, Copilot, etc.) to instantly integrate feedback capabilities into your app.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <CopyButton
                            value={`I want to integrate a feedback system into my application using the Feedback Hub API.
Please create a reusable function or service to submit feedback.

Base URL: ${BASE_URL}
Header: FEEDBACK_API_KEY: <MY_API_KEY> (I will provide the key in .env)

The API endpoint is POST /api/v1/feedback
Body Schema:
{
  "title": string, (required)
  "description": string, (required)
  "type": "bug" | "feature" | "improvement" | "question", (optional, default: bug)
  "priority": "low" | "medium" | "high" | "critical", (optional, default: medium)
  "metadata": object (optional, for browser info, url, user id, etc)
}

Can you implement this?`}
                            className="absolute right-4 top-4"
                        />
                        <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto whitespace-pre-wrap">
                            <code className="text-xs text-slate-50 font-mono">
                                {`I want to integrate a feedback system into my application using the Feedback Hub API.
Please create a reusable function or service to submit feedback.

Base URL: ${BASE_URL}
Header: FEEDBACK_API_KEY: <MY_API_KEY> (I will provide the key in .env)

The API endpoint is POST /api/v1/feedback
Body Schema:
{
  "title": string, (required)
  "description": string, (required)
  "type": "bug" | "feature" | "improvement" | "question", (optional, default: bug)
  "priority": "low" | "medium" | "high" | "critical", (optional, default: medium)
  "metadata": object (optional, for browser info, url, user id, etc)
}

Can you implement this?`}
                            </code>
                        </pre>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-900/10">
                <CardHeader>
                    <CardTitle className="text-purple-700 dark:text-purple-400">🎨 Unified Feedback UI Widget</CardTitle>
                    <CardDescription className="text-purple-600/80 dark:text-purple-400/80">
                        Want a pre-built UI? Use this prompt to generate a standard floating feedback widget that matches Feedback Hub's design.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <CopyButton
                            value={`Please create a "FeedbackWidget" component for my React application.
Requirements:
1.  **UI**: A floating button (with a standard icon like MessageSquare) fixed in the bottom-right corner.
2.  **Interaction**: When clicked, it opens a clean, modern modal/popover.
3.  **Form Fields**:
    *   Title (Input)
    *   Description (Textarea)
    *   Type (Select: Bug, Feature, Improvement, Question)
    *   Priority (Select: Low, Medium, High)
4.  **Styling**: Use Tailwind CSS. Make it look professional and clean (white background, shadow-lg, rounded-xl).
5.  **Logic**: Connect it to the \`submitFeedback\` function/service we created earlier.
6.  **States**: Handle loading state (spinner) and success state (show a "Thank you" message).

Please provide the full code for this component.`}
                            className="absolute right-4 top-4"
                        />
                        <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto whitespace-pre-wrap">
                            <code className="text-xs text-slate-50 font-mono">
                                {`Please create a "FeedbackWidget" component for my React application.
Requirements:
1.  **UI**: A floating button (with a standard icon like MessageSquare) fixed in the bottom-right corner.
2.  **Interaction**: When clicked, it opens a clean, modern modal/popover.
3.  **Form Fields**:
    *   Title (Input)
    *   Description (Textarea)
    *   Type (Select: Bug, Feature, Improvement, Question)
    *   Priority (Select: Low, Medium, High)
4.  **Styling**: Use Tailwind CSS. Make it look professional and clean (white background, shadow-lg, rounded-xl).
5.  **Logic**: Connect it to the \`submitFeedback\` function/service we created earlier.
6.  **States**: Handle loading state (spinner) and success state (show a "Thank you" message).

Please provide the full code for this component.`}
                            </code>
                        </pre>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h3 className="text-2xl font-semibold tracking-tight">Endpoints</h3>

                {/* SUBMIT FEEDBACK */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">POST</Badge>
                            <span className="font-mono text-lg text-muted-foreground">/api/v1/feedback</span>
                        </div>
                        <CardTitle className="mt-2">Submit Feedback</CardTitle>
                        <CardDescription>
                            Create a new feedback entry or bug report from your application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Request Body</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Field</TableHead>
                                        <TableHead className="w-[100px]">Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-[100px]">Required</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">title</TableCell>
                                        <TableCell className="text-xs">string</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">Brief summary of the feedback.</TableCell>
                                        <TableCell className="text-xs font-medium text-red-500">Yes</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">description</TableCell>
                                        <TableCell className="text-xs">string</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">Detailed explanation.</TableCell>
                                        <TableCell className="text-xs font-medium text-red-500">Yes</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">type</TableCell>
                                        <TableCell className="text-xs">enum</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            One of: <code className="bg-muted px-1 py-0.5 rounded">bug</code>, <code className="bg-muted px-1 py-0.5 rounded">feature</code>, <code className="bg-muted px-1 py-0.5 rounded">improvement</code>, <code className="bg-muted px-1 py-0.5 rounded">question</code>
                                        </TableCell>
                                        <TableCell className="text-xs">No (Default: bug)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">priority</TableCell>
                                        <TableCell className="text-xs">enum</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            One of: <code className="bg-muted px-1 py-0.5 rounded">low</code>, <code className="bg-muted px-1 py-0.5 rounded">medium</code>, <code className="bg-muted px-1 py-0.5 rounded">high</code>, <code className="bg-muted px-1 py-0.5 rounded">critical</code>
                                        </TableCell>
                                        <TableCell className="text-xs">No (Default: medium)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">metadata</TableCell>
                                        <TableCell className="text-xs">object</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">Any JSON object with additional context (e.g. browser, user info, URL).</TableCell>
                                        <TableCell className="text-xs">No</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-3">Code Example</h4>
                            <Tabs defaultValue="curl">
                                <TabsList>
                                    <TabsTrigger value="curl">cURL</TabsTrigger>
                                    <TabsTrigger value="js">JavaScript (Fetch)</TabsTrigger>
                                </TabsList>
                                <TabsContent value="curl" className="mt-2">
                                    <div className="relative">
                                        <CopyButton
                                            value={`curl -X POST ${BASE_URL}/api/v1/feedback \\
  -H "Content-Type: application/json" \\
  -H "FEEDBACK_API_KEY: your_project_api_key_here" \\
  -d '{
    "title": "Navigation menu broken on mobile",
    "description": "Clicking the hamburger menu does nothing on iOS Safari.",
    "type": "bug",
    "priority": "high",
    "metadata": {
      "browser": "Safari",
      "os": "iOS 17.2",
      "url": "/dashboard"
    }
  }'`}
                                            className="absolute right-4 top-4"
                                        />
                                        <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
                                            <code className="text-xs text-slate-50 font-mono">
                                                {`curl -X POST ${BASE_URL}/api/v1/feedback \\
  -H "Content-Type: application/json" \\
  -H "FEEDBACK_API_KEY: your_project_api_key_here" \\
  -d '{
    "title": "Navigation menu broken on mobile",
    "description": "Clicking the hamburger menu does nothing on iOS Safari.",
    "type": "bug",
    "priority": "high",
    "metadata": {
      "browser": "Safari",
      "os": "iOS 17.2",
      "url": "/dashboard"
    }
  }'`}
                                            </code>
                                        </pre>
                                    </div>
                                </TabsContent>
                                <TabsContent value="js" className="mt-2">
                                    <div className="relative">
                                        <CopyButton
                                            value={`async function submitFeedback(data) {
  const response = await fetch('${BASE_URL}/api/v1/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'FEEDBACK_API_KEY': 'your_project_api_key_here'
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}

// Usage
submitFeedback({
  title: "Slow loading time",
  description: "Dashboard takes > 5s to load",
  type: "improvement",
  priority: "medium",
  metadata: { pageLoadTime: 5200 }
});`}
                                            className="absolute right-4 top-4"
                                        />
                                        <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
                                            <code className="text-xs text-slate-50 font-mono">
                                                {`async function submitFeedback(data) {
  const response = await fetch('${BASE_URL}/api/v1/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'FEEDBACK_API_KEY': 'your_project_api_key_here'
    },
    body: JSON.stringify(data)
  });

  return await response.json();
}

// Usage
submitFeedback({
  title: "Slow loading time",
  description: "Dashboard takes > 5s to load",
  type: "improvement",
  priority: "medium",
  metadata: { pageLoadTime: 5200 }
});`}
                                            </code>
                                        </pre>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                {/* LIST FEEDBACK */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-green-600 border-green-200 dark:border-green-800 dark:text-green-400">GET</Badge>
                            <span className="font-mono text-lg text-muted-foreground">/api/v1/feedback</span>
                        </div>
                        <CardTitle className="mt-2">List Feedback</CardTitle>
                        <CardDescription>
                            Retrieve a paginated list of feedback for your project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[150px]">Parameter</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-[100px]">Default</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">page</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">Page number for pagination.</TableCell>
                                        <TableCell className="text-xs">1</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">limit</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">Number of items per page.</TableCell>
                                        <TableCell className="text-xs">20</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-mono text-xs">status</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">Filter by status (open, in_progress, resolved, closed).</TableCell>
                                        <TableCell className="text-xs">-</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-3">Code Example</h4>
                            <div className="relative">
                                <CopyButton
                                    value={`curl -X GET "${BASE_URL}/api/v1/feedback?page=1&limit=10&status=open" \\
  -H "FEEDBACK_API_KEY: your_project_api_key_here"`}
                                    className="absolute right-4 top-4"
                                />
                                <pre className="rounded-lg bg-slate-950 p-4 overflow-x-auto">
                                    <code className="text-xs text-slate-50 font-mono">
                                        {`curl -X GET "${BASE_URL}/api/v1/feedback?page=1&limit=10&status=open" \\
  -H "FEEDBACK_API_KEY: your_project_api_key_here"`}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
