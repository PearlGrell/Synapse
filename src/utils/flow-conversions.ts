import { BlueprintNode } from "@/types";
import { Node, Edge, Position } from "@xyflow/react";

export function FlowElementsToJson(nodes: Node[], edges: Edge[]): BlueprintNode | null {
  const nodeMap = new Map<string, Node>();
  const childrenMap = new Map<string, string[]>(); 
  const parentMap = new Map<string, string>(); 

  nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });

  edges.forEach(edge => {
    const { source, target } = edge;
    if (!childrenMap.has(source)) {
      childrenMap.set(source, []);
    }
    childrenMap.get(source)!.push(target);
    parentMap.set(target, source);
  });

  const rootNode = nodes.find(node => !parentMap.has(node.id));
  if (!rootNode) return null;

  function buildTree(nodeId: string): BlueprintNode {
    const node = nodeMap.get(nodeId)!;
    const children = childrenMap.get(nodeId) || [];

    return {
      name: String((node.data as { label?: string })?.label ?? ""),
      children: children.map(childId => buildTree(childId)),
    };
  }

  return buildTree(rootNode.id);
}

export function flowToMD(node: BlueprintNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  let output = `${indent}- ${node.name || "Unnamed"}\n`;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      output += flowToMD(child, depth + 1);
    }
  }

  return output;
}

let nodeIdCounter = 0;

function generateNodeId() {
  return `node-${nodeIdCounter++}`;
}

const NODE_WIDTH = 250;
const NODE_HEIGHT = 50;
const HORIZONTAL_SPACING = 150;
const VERTICAL_SPACING = 30;

export function JsonToFlowElements(root: BlueprintNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let yOffset = 0;

  function traverse(node: BlueprintNode, parentId: string | null, depth = 0): string {
    const id = generateNodeId();
    const x = depth * (NODE_WIDTH + HORIZONTAL_SPACING);
    let y = 0;

    const childIds: string[] = [];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        childIds.push(traverse(child, id, depth + 1));
      });
    }

    if (childIds.length > 0) {
      const firstChildNode = nodes.find(n => n.id === childIds[0]);
      const lastChildNode = nodes.find(n => n.id === childIds[childIds.length - 1]);
      if (firstChildNode && lastChildNode) {
        y = (firstChildNode.position.y + lastChildNode.position.y) / 2;
      }
    } else {
      y = yOffset;
      yOffset += NODE_HEIGHT + VERTICAL_SPACING;
    }

    nodes.push({
      id,
      style: { width: NODE_WIDTH },
      data: { label: node.name },
      position: { x, y },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: "default",
      });
    }

    return id;
  }

  nodeIdCounter = 0;
  traverse(root, null, 0);

  return { nodes, edges };
}