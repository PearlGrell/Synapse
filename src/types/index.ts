import { Node, Edge } from "@xyflow/react";

export interface AsyncResult<T> {
    status: 'idle' | 'loading' | 'success' | 'error';
    data: T | null;
    error: string | null;
}

export interface BlueprintNode{
    name: string;
    children: BlueprintNode[];
}

export interface FlowData {
    nodes: Node[];
    edges: Edge[];
}

export interface SidebarState {
    sidebarOpened: boolean;
    contentOpened: boolean;
}