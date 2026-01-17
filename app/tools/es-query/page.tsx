'use client';

import { useState, useCallback, useEffect } from 'react';
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

  // Parse query whenever input changes
  useEffect(() => {
    const result = parseESQuery(input);
    setParseResult(result);
    // Clear selection if parse failed
    if (!result.success) {
      setSelectedNodeId(null);
    }
  }, [input]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeRemove = useCallback(
    (nodeId: string) => {
      // Find and remove the node from the JSON
      // For now, just deselect
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      // TODO: Implement actual node removal from JSON
    },
    [selectedNodeId]
  );

  // Find selected node in tree
  const findNode = (node: ESNode, id: string): ESNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

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
