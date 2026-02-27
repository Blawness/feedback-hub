"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";

interface PrdViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    prdContent: string;
    ideaTitle: string;
    isGenerating?: boolean;
    onRegenerate?: () => void;
}

export function PrdViewerModal({ isOpen, onClose, prdContent, ideaTitle, isGenerating, onRegenerate }: PrdViewerModalProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prdContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([prdContent], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PRD-${ideaTitle.replace(/[^a-zA-Z0-9]/g, "-")}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        PRD — {ideaTitle}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                        <Markdown>{prdContent}</Markdown>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t gap-2 sm:gap-0 justify-between">
                    <div className="flex gap-2">
                        {onRegenerate && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRegenerate}
                                disabled={isGenerating}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Regenerate
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            {isCopied ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy to Clipboard
                                </>
                            )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Download .md
                        </Button>
                        <Button variant="secondary" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
