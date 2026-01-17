'use client';

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, X } from 'lucide-react';
import { ESNode, ParseResult } from '@/lib/core/es-query';
import { cn } from '@/lib/utils';

// Type-based color mapping for node pills
const TYPE_COLORS: Record<string, string> = {
  query: 'bg-slate-500',
  bool: 'bg-purple-500',
  must: 'bg-blue-500',
  should: 'bg-blue-400',
  must_not: 'bg-red-400',
  filter: 'bg-blue-600',
  match: 'bg-green-500',
  match_phrase: 'bg-green-600',
  multi_match: 'bg-green-400',
  term: 'bg-emerald-500',
  terms: 'bg-emerald-600',
  range: 'bg-teal-500',
  exists: 'bg-cyan-500',
  nested: 'bg-violet-500',
  script_score: 'bg-fuchsia-500',
  knn: 'bg-pink-500',
  dis_max: 'bg-amber-600',
  constant_score: 'bg-sky-500',
  match_none: 'bg-gray-400',
  aggs: 'bg-orange-500',
  agg_terms: 'bg-orange-400',
  agg_histogram: 'bg-orange-600',
  agg_date_histogram: 'bg-amber-500',
  agg_avg: 'bg-yellow-500',
  agg_sum: 'bg-yellow-600',
  agg_cardinality: 'bg-lime-500',
  sort: 'bg-pink-500',
  source: 'bg-rose-500',
  size: 'bg-indigo-400',
  from: 'bg-indigo-500',
  unknown: 'bg-gray-500',
};

// Get human-readable label for node type
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    query: 'Query',
    bool: 'bool',
    must: 'MUST',
    should: 'SHOULD',
    must_not: 'MUST NOT',
    filter: 'FILTER',
    match: 'match',
    match_phrase: 'match_phrase',
    multi_match: 'multi_match',
    term: 'term',
    terms: 'terms',
    range: 'range',
    exists: 'exists',
    nested: 'nested',
    script_score: 'script_score',
    knn: 'knn',
    dis_max: 'dis_max',
    constant_score: 'constant_score',
    match_none: 'match_none',
    aggs: 'Aggregations',
    agg_terms: 'terms',
    agg_histogram: 'histogram',
    agg_date_histogram: 'date_histogram',
    agg_avg: 'avg',
    agg_sum: 'sum',
    agg_cardinality: 'cardinality',
    sort: 'Sort',
    source: '_source',
    size: 'size',
    from: 'from',
  };
  return labels[type] || type;
}

// Get value preview for a node
function getValuePreview(node: ESNode): string | null {
  const { type, field, params, name } = node;

  // For aggregations, show the name
  if (name && type.startsWith('agg_')) {
    return field ? `${name} (${field})` : name;
  }

  // For terms queries - show field, values, and optional name
  if (type === 'terms' && field) {
    const values = params.values as unknown[];
    const valuesPreview =
      values && values.length <= 2
        ? values.map((v) => `"${v}"`).join(', ')
        : `${values?.length || 0} values`;
    const nameTag = params._name ? ` (${params._name})` : '';
    return `${field}: [${valuesPreview}]${nameTag}`;
  }

  // For term queries - show field, value, and optional name
  if (type === 'term' && field) {
    const nameTag = params._name ? ` (${params._name})` : '';
    return `${field}: "${params.value}"${nameTag}`;
  }

  // For field-based queries
  if (field) {
    const value =
      params.query || params.value || params.values || params.field;
    if (typeof value === 'string') {
      return `${field}: "${value}"`;
    }
    if (typeof value === 'number') {
      return `${field}: ${value}`;
    }
    if (Array.isArray(value)) {
      return `${field}: [${value.length} values]`;
    }
  }

  // For range queries
  if (type === 'range' && field) {
    const parts: string[] = [];
    if (params.gte !== undefined) parts.push(`>= ${params.gte}`);
    if (params.gt !== undefined) parts.push(`> ${params.gt}`);
    if (params.lte !== undefined) parts.push(`<= ${params.lte}`);
    if (params.lt !== undefined) parts.push(`< ${params.lt}`);
    return `${field}: ${parts.join(', ')}`;
  }

  // For exists queries
  if (type === 'exists') {
    return `field: ${params.field}`;
  }

  // For size/from
  if (type === 'size' || type === 'from') {
    return String(params.value);
  }

  // For knn query
  if (type === 'knn') {
    const parts: string[] = [];
    if (field) parts.push(field);
    if (params.k) parts.push(`k=${params.k}`);
    if (params._name) parts.push(`(${params._name})`);
    return parts.join(' ');
  }

  // For script_score
  if (type === 'script_score') {
    if (params.min_score !== undefined) {
      return `min_score: ${params.min_score}`;
    }
    return null;
  }

  // For dis_max
  if (type === 'dis_max') {
    const parts: string[] = [];
    if (params.boost) parts.push(`boost=${params.boost}`);
    if (params._name) parts.push(`(${params._name})`);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  // For constant_score
  if (type === 'constant_score') {
    const parts: string[] = [];
    if (params.boost) parts.push(`boost=${params.boost}`);
    if (params._name) parts.push(`(${params._name})`);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  // For multi_match
  if (type === 'multi_match') {
    const query = params.query as string | undefined;
    const fields = params.fields as string[] | undefined;
    if (query && fields) {
      return `"${query}" → [${fields.length} fields]`;
    }
    if (query) return `"${query}"`;
    return null;
  }

  return null;
}

interface TreeNodeProps {
  node: ESNode;
  depth: number;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeRemove: (nodeId: string) => void;
}

function TreeNode({
  node,
  depth,
  selectedNodeId,
  onNodeSelect,
  onNodeRemove,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(!node.meta.collapsed);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const valuePreview = getValuePreview(node);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded(!expanded);
    },
    [expanded]
  );

  const handleSelect = useCallback(() => {
    onNodeSelect(isSelected ? null : node.id);
  }, [node.id, isSelected, onNodeSelect]);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNodeRemove(node.id);
    },
    [node.id, onNodeRemove]
  );

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all',
          'hover:bg-white/5',
          isSelected && 'bg-purple-500/20 ring-1 ring-purple-500/50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Type pill */}
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium text-white',
            TYPE_COLORS[node.type] || TYPE_COLORS.unknown
          )}
        >
          {getTypeLabel(node.type)}
        </span>

        {/* Value preview */}
        {valuePreview && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {valuePreview}
          </span>
        )}

        {/* Quick actions (show on hover) */}
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={handleRemove}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
            title="Remove node"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onNodeSelect={onNodeSelect}
              onNodeRemove={onNodeRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface QueryTreeProps {
  parseResult: ParseResult | null;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onNodeRemove: (nodeId: string) => void;
}

export function QueryTree({
  parseResult,
  selectedNodeId,
  onNodeSelect,
  onNodeRemove,
}: QueryTreeProps) {
  if (!parseResult?.success || !parseResult.root) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-sm font-medium text-muted-foreground">
            Query Tree
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {parseResult?.error ? (
            <span className="text-red-400">Parse error - check input</span>
          ) : (
            <span>Enter a valid ES query to see the tree</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-medium text-muted-foreground">
          Query Tree
        </span>
        <span className="text-xs text-muted-foreground">
          Click to select, X to remove
        </span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        <TreeNode
          node={parseResult.root}
          depth={0}
          selectedNodeId={selectedNodeId}
          onNodeSelect={onNodeSelect}
          onNodeRemove={onNodeRemove}
        />
      </div>
    </div>
  );
}
