import { AsyncResult, BlueprintNode } from "@/types";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useState } from "react";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";

interface SidebarProps {
    userPrompt: string;
    setUserPrompt: (prompt: string) => void;
    isGenerating: boolean;
    blueprintResult: AsyncResult<BlueprintNode>;
    hasGeneratedBlueprint: boolean;
    contentResult: AsyncResult<string>;
    handleGenerateBlueprint: (prompt: string) => Promise<void>;
    handleGenerateContent: () => Promise<void>;
    handleExport: () => Promise<void>;
    isExporting: boolean;
}

export default function Sidebar({
    userPrompt,
    setUserPrompt,
    isGenerating,
    blueprintResult,
    hasGeneratedBlueprint,
    contentResult,
    handleGenerateBlueprint,
    handleGenerateContent,
    handleExport,
    isExporting,
}: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const toggleSidebar = () => setCollapsed(!collapsed);

    const sidebarClasses = collapsed ? "w-16" : "w-[24rem]";

    return (
        <aside className={`${sidebarClasses} flex-shrink-0 h-screen bg-slate text-white border-r border-slate-800 transition-all duration-200 ease-in-out overflow-y-auto relative`}>
            {!collapsed ? (
                <div className="flex flex-col h-full p-6 space-y-6">

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Synapse</h1>
                            <p className="text-sm text-slate-400 mt-1">Transforming Ideas into Intelligent Blueprints</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Collapse sidebar">
                            <PanelLeftCloseIcon className="text-white" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">1. Generate the Flow</h3>
                        <Textarea
                            placeholder="Enter your topic here..."
                            maxLength={500}
                            value={userPrompt}
                            disabled={isGenerating || blueprintResult.status === "success"}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerateBlueprint(userPrompt);
                                }
                            }}
                            className="min-h-[100px] text-white border border-slate-700 placeholder-slate-500"
                        />
                        <Button
                            onClick={() => handleGenerateBlueprint(userPrompt)}
                            disabled={isGenerating || blueprintResult.status === "success" || !userPrompt.trim()}
                            className="w-full"
                        >
                            {blueprintResult.status === "loading" && "Generating..."}
                            {blueprintResult.status === "success" && "Generated ✓"}
                            {blueprintResult.status !== "loading" && blueprintResult.status !== "success" && "Generate Blueprint"}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">2. Generate Content</h3>
                        <p className="text-sm text-slate-400">Our RAG-based LLM will generate the content for you based on the blueprint.</p>
                        <Button
                            onClick={handleGenerateContent}
                            disabled={!hasGeneratedBlueprint || isGenerating || contentResult.status === "success"}
                            className="w-full"
                        >
                            {contentResult.status === "loading" && "Generating..."}
                            {contentResult.status === "success" && "Content Ready ✓"}
                            {contentResult.status !== "loading" && contentResult.status !== "success" && "Generate Content"}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">3. Export PDF</h3>
                        <p className="text-sm text-slate-400">Export the generated content as a PDF file.</p>
                        <Button
                            onClick={handleExport}
                            disabled={contentResult.status !== "success" || isExporting}
                            className="w-full"
                        >
                            {isExporting ? "Exporting..." : "Export PDF"}
                        </Button>
                    </div>

                    <div className="flex-grow" />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-between h-full py-4 border-r border-slate-800">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Expand sidebar">
                        <PanelLeftOpenIcon className="w-6 h-6 text-white" />
                    </Button>
                </div>
            )}
        </aside>
    );
}
