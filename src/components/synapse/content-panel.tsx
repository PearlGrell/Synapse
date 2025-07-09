import { AsyncResult } from "@/types";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { GripVertical, Loader2, PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { errorMessage } from "@/utils/error-handling";
import { marked } from "marked";

interface ContentPanelProps {
    contentResult: AsyncResult<string>;
    isGenerating: boolean;
    handleGenerateContent: () => Promise<void>;
}

export default function ContentPanel({
    contentResult,
    isGenerating,
    handleGenerateContent,
}: ContentPanelProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [loadingText, setLoadingText] = useState("Generating content");
    const [width, setWidth] = useState(400);
    const isResizing = useRef(false);

    const startResizing = () => {
        isResizing.current = true;
        document.addEventListener("mousemove", resizePanel);
        document.addEventListener("mouseup", stopResizing);
        document.body.style.userSelect = "none";
    };

    const resizePanel = (e: MouseEvent) => {
        if (!isResizing.current) return;

        const screenWidth = window.innerWidth;
        const calculatedWidth = screenWidth - e.clientX;
        const maxAllowed = screenWidth / 3;

        if (calculatedWidth > 400 && calculatedWidth < maxAllowed) {
            setWidth(calculatedWidth);
        }
    };

    const stopResizing = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", resizePanel);
        document.removeEventListener("mouseup", stopResizing);
        document.body.style.userSelect = "";
    };

    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (contentResult.status === "loading") {
            startTimeRef.current = Date.now();
            let dotCount = 0;
            setLoadingText("Generating content");

            const interval = setInterval(() => {
                dotCount = (dotCount + 1) % 4;
                setLoadingText("This generally takes ~ 3-8 minutes depending on the complexity of the document. Please be patient" + ".".repeat(dotCount));
            }, 500);

            return () => clearInterval(interval);
        }

        if (contentResult.status === "success" && startTimeRef.current) {
            const elapsedTime = Date.now() - startTimeRef.current;
            const seconds = Math.floor(elapsedTime / 1000);
            setLoadingText(`Your content is ready! Generated in ${seconds} second${seconds !== 1 ? "s" : ""}`);
            startTimeRef.current = null;
        }
    }, [contentResult.status]);

    return (
        <div
            className={`h-screen bg-slate text-white border-l border-white/10 overflow-y-auto relative transition-all duration-100 ease-out ${collapsed ? "w-16" : "min-w-[400px] max-w-[33.33vw]"
                }`}
            style={!collapsed ? { width: `${width}px` } : undefined}
        >
            {!collapsed ? (
                <div className="flex flex-col h-full p-6 pb-0 space-y-6">
                    <div className="flex justify-between items-start">
                        <h1 className="text-3xl font-bold">Generated Content</h1>
                    </div>
                    <div className="flex flex-col flex-grow space-y-2 min-h-0">
                        <h3 className="text-xl font-semibold">Content</h3>
                        <div className="flex items-center space-x-4">
                            {contentResult.status === "loading" && (
                                <Loader2 className="animate-spin text-white w-5 h-5" />
                            )}
                            <span className="text-sm text-slate-400">{loadingText}</span>
                        </div>

                        {contentResult.status === "loading" && (
                            <SkeletonContent />
                        )}
                        {contentResult.status === "success" ? (
                            <Content content={contentResult.data || ""} />
                        ) : contentResult.status === "error" && (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
                                <p>Error generating content: {errorMessage(contentResult.error)}</p>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Collapse content panel"
                        className="absolute top-4 right-4"
                    >
                        {collapsed ? (
                            <PanelRightOpenIcon className="text-white" />
                        ) : (
                            <PanelRightCloseIcon className="text-white" />
                        )}
                    </Button>
                </div>
            ) : (
                <div className="flex pt-4 justify-center h-full">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Expand content panel"
                    >
                        <PanelRightOpenIcon className="text-white" />
                    </Button>
                </div>
            )}

            {!collapsed && (
                <div onMouseDown={startResizing} className="absolute left-0 top-0 h-full w-2 cursor-ew-resize bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
                    <GripVertical className="w-8 h-8 text-white/50" />
                </div>
            )}
        </div>
    );
}


interface ContentProps {
    content: string;
}

function Content({ content }: ContentProps) {

    const html = marked.parse(content, {
        gfm: true,
        breaks: true,
    });



    return (
        <div
            className="bg-white/5 p-4 rounded-lg flex-grow min-h-0 overflow-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <article
                className="prose prose-invert max-w-full"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}

function SkeletonContent() {
    return (
        <div className="bg-white/5 border border-white/20 rounded-lg p-4 space-y-3 animate-pulse">
            {Array.from({ length: 27 }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-white/30 rounded"
                    style={{
                        width: i % 12 === 10 ? "60%" : i % 12 === 11 ? "0%" : "100%",
                        flexShrink: 0
                    }}
                />
            ))}
        </div>
    );
}