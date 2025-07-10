"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadIcon, Loader2, RotateCcw, SparklesIcon } from "lucide-react";
import { CommandDialog, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { FlowElementsToJson } from "@/utils/flow-conversions";

interface FlowEditorProps {
  nodes: Node[];
  edges: Edge[];
  disabled: boolean;
  generating: boolean;
  onUpdateBlueprint: (prompt: string, blueprint: any, promptHistory: string[]) => void;
  onReset: () => void;
  blueprint: any;
  promptHistory: string[];
}

const FlowEditor: React.FC<FlowEditorProps> = ({
  nodes: _nodes,
  edges: _edges,
  disabled = true,
  generating = false,
  onUpdateBlueprint,
  onReset,
  blueprint,
  promptHistory,
}) => {

  const [nodes, setNodes, onNodesChange] = useNodesState(_nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(_edges);
  const [open, setOpen] = useState(false);
  const [generated, setGenerated] = useState<boolean>(false);

  const { fitView } = useReactFlow();
  const hasFittedView = useRef(false);

  const handleReset = useCallback(() => {
    onReset();
    setGenerated(false);
    hasFittedView.current = false;
  }, []);

  const handleCommandOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleExport = useCallback(async () => {
    const blueprint = FlowElementsToJson(nodes, edges);

    if (!blueprint) {
      toast.error("Failed to export: No root node found", {
        style: {
          width: "auto",
          textAlign: "center",
        },
      });
      return;
    }

    toast.info("Exporting blueprint as PDF...", {
      id: "exporting-blueprint",
      duration: Infinity,
      style: {
        width: "auto",
        textAlign: "center",
      },
    });

    const res = await fetch("/api/blueprint/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blueprint),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${blueprint.name.replaceAll("_ ", ": ") || ""} Blueprint.pdf`.trim();
    link.click();

    toast.dismiss("exporting-blueprint");
    toast.success("Blueprint exported as PDF", {
      style: {
        width: "auto",
        textAlign: "center",
      },
    });
  }, [nodes, edges]);

  useEffect(() => {
    setNodes(_nodes);
    setEdges(_edges);

    if (!hasFittedView.current && _nodes.length > 0) {
      window.requestAnimationFrame(() => {
        fitView({ duration: 300, padding: 0.1 });
        hasFittedView.current = true;
        setGenerated(true);
      });
    }
  }, [_nodes, _edges]);


  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        handleCommandOpen();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        handleReset();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        handleExport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  useEffect(() => {
    if (generating) {
      toast(generated ? "Updating" : "Generating", {
        position: "top-right",
        id: "generating-blueprint",
        duration: Infinity,
        style: {
          width: "auto",
        },
        icon: <Loader2 className="animate-spin" />,
      });
    }
    else {
      toast.dismiss("generating-blueprint");
    }
  }, [generating]);

  if (nodes.length === 0 && edges.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No nodes or edges available. Please generate a blueprint.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        attributionPosition={"top-right"}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        {
          !disabled && (
            <>
              <MiniMap position="top-left" />
              <Controls />
              <div className="absolute bottom-2 right-2 z-10 flex flex-col space-y-2">
                <Button className="space-x-2" onClick={handleReset} disabled={generating} title="Reset Blueprint">
                  <RotateCcw className="h-6 w-6" />
                  <CommandShortcut className="text-white">⌘ P</CommandShortcut>
                </Button>
                <Button className="space-x-2" onClick={handleCommandOpen} disabled={generating} title="Update Blueprint">
                  <SparklesIcon className="h-6 w-6" />
                  <CommandShortcut className="text-white">⌘ K</CommandShortcut>
                </Button>
                <Button className="space-x-2" onClick={handleExport} disabled={generating} title="Export Blueprint">
                  <DownloadIcon className="h-6 w-6" />
                  <CommandShortcut className="text-white">⌘ E</CommandShortcut>
                </Button>
              </div>
            </>
          )
        }
      </ReactFlow>
      <CommandDialog open={open} onOpenChange={setOpen} className="bg-muted" >
        <CommandInput placeholder="Enter your blueprint prompt..." onKeyDown={
          (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              const prompt = e.currentTarget.value.trim();
              if (prompt) {
                onUpdateBlueprint(prompt, promptHistory, blueprint);
                setOpen(false);
              }
            }
          }
        } />
        <CommandList className="cursor-pointer text-sm">
          <CommandItem>
            <span className="font-mono text-muted-foreground w-24">/add</span>
            <span className="ml-2">Add a new subtopic to the blueprint</span>
          </CommandItem>

          <CommandItem>
            <span className="font-mono text-muted-foreground w-24">/expand</span>
            <span className="ml-2">Expand a concept with foundational subtopics</span>
          </CommandItem>

          <CommandItem>
            <span className="font-mono text-muted-foreground w-24">/rename</span>
            <span className="ml-2">Rename a specific node in the hierarchy</span>
          </CommandItem>

          <CommandItem>
            <span className="font-mono text-muted-foreground w-24">/delete</span>
            <span className="ml-2">Delete a node or branch from the blueprint</span>
          </CommandItem>

          <CommandItem>
            <span className="font-mono text-muted-foreground w-24">/reorganize</span>
            <span className="ml-2">Restructure a subtree to improve organization</span>
          </CommandItem>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

const FlowEditorWrapper: React.FC<FlowEditorProps> = (props) => (
  <ReactFlowProvider>
    <FlowEditor {...props} />
  </ReactFlowProvider>
);

export default FlowEditorWrapper;