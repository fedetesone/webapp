'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Braces } from 'lucide-react';
import {
  parseESQuery,
  ESNode,
  ParseResult,
} from '@/lib/core/es-query';
import { QueryInput } from '@/components/es-query/query-input';
import { QueryTree } from '@/components/es-query/query-tree';
import { QueryDetail } from '@/components/es-query/query-detail';

const SAMPLE_QUERY = `{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "search term" } }
      ],
      "filter": [
        { "term": { "status": "active" } },
        { "range": { "price": { "gte": 10, "lte": 100 } } }
      ]
    }
  },
  "aggs": {
    "categories": {
      "terms": { "field": "category" }
    }
  },
  "size": 20
}`;

// Recursively remove empty arrays and objects from JSON
function cleanupEmpty(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    const cleaned = obj
      .map((item) => cleanupEmpty(item))
      .filter((item) => {
        if (Array.isArray(item)) return item.length > 0;
        if (typeof item === 'object' && item !== null)
          return Object.keys(item).length > 0;
        return true;
      });
    return cleaned;
  }

  if (typeof obj === 'object' && obj !== null) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanupEmpty(value);
      // Skip empty arrays and objects
      if (Array.isArray(cleanedValue) && cleanedValue.length === 0) continue;
      if (
        typeof cleanedValue === 'object' &&
        cleanedValue !== null &&
        Object.keys(cleanedValue).length === 0
      )
        continue;
      cleaned[key] = cleanedValue;
    }
    return cleaned;
  }

  return obj;
}

export default function ESQueryPage() {
  const [input, setInput] = useState(SAMPLE_QUERY); // Original input (left panel)
  const [workingJson, setWorkingJson] = useState(SAMPLE_QUERY); // Modified version (tree/output)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Undo history stack for tree modifications
  const undoStack = useRef<string[]>([]);

  // Parse working JSON (used for tree and output)
  useEffect(() => {
    const result = parseESQuery(workingJson);
    setParseResult(result);
    if (!result.success) {
      setSelectedNodeId(null);
    }
  }, [workingJson]);

  // When input changes (user typing), sync working JSON
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setWorkingJson(value);
    // Clear undo stack when user manually edits
    undoStack.current = [];
  }, []);

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z) - only for tree modifications
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (undoStack.current.length > 0) {
          e.preventDefault();
          const previousState = undoStack.current.pop()!;
          setWorkingJson(previousState);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Find node in tree by ID
  const findNode = useCallback(
    (node: ESNode, id: string): ESNode | null => {
      if (node.id === id) return node;
      for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
      return null;
    },
    []
  );

  const handleNodeRemove = useCallback(
    (nodeId: string) => {
      if (!parseResult?.root) return;

      // Find the node to get its path
      const nodeToRemove = findNode(parseResult.root, nodeId);
      if (!nodeToRemove || nodeToRemove.meta.path.length === 0) return;

      try {
        let json = JSON.parse(workingJson);
        const path = nodeToRemove.meta.path;

        // Navigate to parent and remove the node
        let current = json;
        const parentPath = path.slice(0, -1);
        const lastKey = path[path.length - 1];

        // Navigate to parent
        for (const key of parentPath) {
          if (current[key] === undefined) return;
          current = current[key];
        }

        // Remove the node
        if (Array.isArray(current)) {
          const index = parseInt(lastKey, 10);
          if (!isNaN(index)) {
            current.splice(index, 1);
          }
        } else if (typeof current === 'object' && current !== null) {
          delete current[lastKey];
        }

        // Clean up empty arrays and objects
        json = cleanupEmpty(json);

        // Push current state to undo stack before updating
        undoStack.current.push(workingJson);

        // Update working JSON (not the original input)
        setWorkingJson(JSON.stringify(json, null, 2));

        // Clear selection
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null);
        }
      } catch {
        // If JSON manipulation fails, just deselect
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null);
        }
      }
    },
    [workingJson, parseResult, selectedNodeId, findNode]
  );

  const selectedNode =
    parseResult?.root && selectedNodeId
      ? findNode(parseResult.root, selectedNodeId)
      : null;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Braces className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">ES Query Visualizer</h1>
          <p className="text-sm text-muted-foreground">
            Paste, visualize, and generate code for Elasticsearch queries
          </p>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Query Input */}
        <div className="w-1/3 border-r border-white/10 flex flex-col">
          <QueryInput
            value={input}
            onChange={handleInputChange}
            parseResult={parseResult}
          />
        </div>

        {/* Center Panel - Query Tree */}
        <div className="w-1/3 border-r border-white/10 flex flex-col overflow-hidden">
          <QueryTree
            parseResult={parseResult}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            onNodeRemove={handleNodeRemove}
          />
        </div>

        {/* Right Panel - Query Detail */}
        <div className="w-1/3 flex flex-col overflow-hidden">
          <QueryDetail
            parseResult={parseResult}
            selectedNode={selectedNode}
          />
        </div>
      </div>
    </div>
  );
}
