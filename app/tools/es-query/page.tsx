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

export default function ESQueryPage() {
  const [input, setInput] = useState(SAMPLE_QUERY);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Undo history stack
  const undoStack = useRef<string[]>([]);
  const isUndoing = useRef(false);

  // Parse query whenever input changes
  useEffect(() => {
    const result = parseESQuery(input);
    setParseResult(result);
    // Clear selection if parse failed
    if (!result.success) {
      setSelectedNodeId(null);
    }
  }, [input]);

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (undoStack.current.length > 0) {
          e.preventDefault();
          isUndoing.current = true;
          const previousState = undoStack.current.pop()!;
          setInput(previousState);
          // Small delay to reset the flag
          setTimeout(() => {
            isUndoing.current = false;
          }, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
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
        const json = JSON.parse(input);
        const path = nodeToRemove.meta.path;

        // Navigate to parent and remove the node
        // Path looks like: ['query', 'bool', 'must', '0'] or ['query', 'script_score', 'query', 'bool']
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

        // Push current state to undo stack before updating
        undoStack.current.push(input);

        // Update input with modified JSON
        setInput(JSON.stringify(json, null, 2));

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
    [input, parseResult, selectedNodeId, findNode]
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
