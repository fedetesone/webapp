'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Check, Copy, FileCode, Terminal, FileText, Braces } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ESNode,
  ParseResult,
  generateJava,
  generatePython,
  generateCurl,
} from '@/lib/core/es-query';
import { cn } from '@/lib/utils';

type TabType = 'summary' | 'json' | 'java' | 'curl' | 'python';

interface QueryDetailProps {
  parseResult: ParseResult | null;
  selectedNode: ESNode | null;
}

// Color scheme for different elements
const colors = {
  // Section headers
  sectionQuery: 'text-purple-400 font-semibold',
  sectionFilter: 'text-blue-400 font-semibold',
  sectionMust: 'text-emerald-400 font-semibold',
  sectionMustNot: 'text-red-400 font-semibold',
  sectionShould: 'text-amber-400 font-semibold',
  sectionAggs: 'text-orange-400 font-semibold',
  sectionPagination: 'text-indigo-400 font-semibold',
  sectionSort: 'text-pink-400 font-semibold',
  sectionFields: 'text-rose-400 font-semibold',
  // Values
  field: 'text-cyan-300',
  value: 'text-green-300',
  operator: 'text-slate-400',
  nameTag: 'text-slate-500 italic',
  boost: 'text-yellow-300',
  keyword: 'text-violet-300',
  number: 'text-orange-300',
  // Nested/special
  nested: 'text-violet-400 font-medium',
  knn: 'text-pink-400 font-medium',
  scriptScore: 'text-fuchsia-400 font-medium',
};

interface SummaryLine {
  indent: number;
  elements: React.ReactNode;
  key: string;
}

// Generate colorful summary as React elements
function generateColorfulSummary(root: ESNode): SummaryLine[] {
  const lines: SummaryLine[] = [];
  let lineKey = 0;

  function addLine(indent: number, elements: React.ReactNode) {
    lines.push({ indent, elements, key: `line-${lineKey++}` });
  }

  function processNode(node: ESNode, indent: number = 0): void {
    switch (node.type) {
      case 'query':
        addLine(0, <span className={colors.sectionQuery}>Query</span>);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'bool':
        node.children.forEach((child) => processNode(child, indent));
        break;

      case 'filter':
        addLine(
          indent,
          <span className={colors.sectionFilter}>FILTER</span>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'must':
        addLine(indent, <span className={colors.sectionMust}>MUST</span>);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'must_not':
        addLine(
          indent,
          <span className={colors.sectionMustNot}>MUST NOT</span>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'should':
        addLine(indent, <span className={colors.sectionShould}>SHOULD</span>);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'match':
      case 'match_phrase': {
        const verb = node.type === 'match' ? 'matches' : 'matches phrase';
        const value = node.params.query || node.params.value;
        addLine(
          indent,
          <>
            <span className={colors.field}>{node.field}</span>
            <span className={colors.operator}> {verb} </span>
            <span className={colors.value}>&quot;{String(value)}&quot;</span>
          </>
        );
        break;
      }

      case 'term': {
        const value = node.params.value;
        const nameTag = node.params._name ? (
          <span className={colors.nameTag}> [{String(node.params._name)}]</span>
        ) : null;
        addLine(
          indent,
          <>
            <span className={colors.field}>{node.field}</span>
            <span className={colors.operator}> = </span>
            <span className={colors.value}>&quot;{String(value)}&quot;</span>
            {nameTag}
          </>
        );
        break;
      }

      case 'terms': {
        const values = (node.params.values || node.params.value) as unknown[];
        const nameTag = node.params._name ? (
          <span className={colors.nameTag}> [{String(node.params._name)}]</span>
        ) : null;
        if (Array.isArray(values)) {
          const valuesDisplay =
            values.length <= 3
              ? values.map((v) => `"${v}"`).join(', ')
              : `${values.length} values`;
          addLine(
            indent,
            <>
              <span className={colors.field}>{node.field}</span>
              <span className={colors.operator}> in </span>
              <span className={colors.value}>[{valuesDisplay}]</span>
              {nameTag}
            </>
          );
        }
        break;
      }

      case 'nested': {
        const path = node.params.path;
        const nameTag = node.params._name ? (
          <span className={colors.nameTag}> [{String(node.params._name)}]</span>
        ) : null;
        addLine(
          indent,
          <>
            <span className={colors.nested}>Nested</span>
            <span className={colors.operator}> path: </span>
            <span className={colors.field}>{String(path)}</span>
            {nameTag}
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;
      }

      case 'script_score': {
        const minScore = node.params.min_score;
        addLine(
          indent,
          <>
            <span className={colors.scriptScore}>Script Score Query</span>
            {minScore !== undefined && (
              <>
                <span className={colors.operator}> min_score: </span>
                <span className={colors.number}>{String(minScore)}</span>
              </>
            )}
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;
      }

      case 'knn': {
        const k = node.params.k;
        const nameTag = node.params._name ? (
          <span className={colors.nameTag}> [{String(node.params._name)}]</span>
        ) : null;
        addLine(
          indent,
          <>
            <span className={colors.knn}>KNN</span>
            <span className={colors.operator}> on </span>
            <span className={colors.field}>{node.field}</span>
            <span className={colors.operator}> (k=</span>
            <span className={colors.number}>{String(k)}</span>
            <span className={colors.operator}>)</span>
            {nameTag}
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;
      }

      case 'dis_max': {
        const boost = node.params.boost;
        const nameTag = node.params._name ? (
          <span className={colors.nameTag}> [{String(node.params._name)}]</span>
        ) : null;
        addLine(
          indent,
          <>
            <span className={colors.keyword}>Best match of:</span>
            {boost && (
              <>
                <span className={colors.operator}> (boost=</span>
                <span className={colors.boost}>{String(boost)}</span>
                <span className={colors.operator}>)</span>
              </>
            )}
            {nameTag}
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;
      }

      case 'constant_score': {
        const boost = node.params.boost;
        const nameTag = node.params._name ? (
          <span className={colors.nameTag}> [{String(node.params._name)}]</span>
        ) : null;
        addLine(
          indent,
          <>
            <span className={colors.keyword}>Constant score</span>
            <span className={colors.operator}> (boost=</span>
            <span className={colors.boost}>{String(boost)}</span>
            <span className={colors.operator}>)</span>
            {nameTag}
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;
      }

      case 'multi_match': {
        const query = node.params.query;
        const fields = node.params.fields as string[] | undefined;
        const nameTag = node.params._name ? (
          <span className={colors.nameTag}> [{String(node.params._name)}]</span>
        ) : null;
        addLine(
          indent,
          <>
            <span className={colors.keyword}>Multi-match</span>
            <span className={colors.value}> &quot;{String(query)}&quot;</span>
            <span className={colors.operator}> in </span>
            <span className={colors.field}>[{fields?.join(', ') || '?'}]</span>
            {nameTag}
          </>
        );
        break;
      }

      case 'match_none':
        addLine(
          indent,
          <span className={colors.keyword}>Match nothing</span>
        );
        break;

      case 'range': {
        const parts: React.ReactNode[] = [];
        if (node.params.gte !== undefined) {
          parts.push(
            <span key="gte">
              <span className={colors.operator}>&gt;= </span>
              <span className={colors.number}>{String(node.params.gte)}</span>
            </span>
          );
        }
        if (node.params.gt !== undefined) {
          parts.push(
            <span key="gt">
              <span className={colors.operator}>&gt; </span>
              <span className={colors.number}>{String(node.params.gt)}</span>
            </span>
          );
        }
        if (node.params.lte !== undefined) {
          parts.push(
            <span key="lte">
              <span className={colors.operator}>&lt;= </span>
              <span className={colors.number}>{String(node.params.lte)}</span>
            </span>
          );
        }
        if (node.params.lt !== undefined) {
          parts.push(
            <span key="lt">
              <span className={colors.operator}>&lt; </span>
              <span className={colors.number}>{String(node.params.lt)}</span>
            </span>
          );
        }
        addLine(
          indent,
          <>
            <span className={colors.field}>{node.field}</span>
            <span className={colors.operator}> </span>
            {parts.reduce<React.ReactNode[]>((acc, part, i) => {
              if (i > 0) acc.push(<span key={`and-${i}`} className={colors.operator}> and </span>);
              acc.push(part);
              return acc;
            }, [])}
          </>
        );
        break;
      }

      case 'exists':
        addLine(
          indent,
          <>
            <span className={colors.field}>{String(node.params.field)}</span>
            <span className={colors.keyword}> exists</span>
          </>
        );
        break;

      case 'aggs':
        addLine(indent, null); // blank line
        addLine(0, <span className={colors.sectionAggs}>Aggregations</span>);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_terms':
        addLine(
          indent,
          <>
            <span className={colors.keyword}>{node.name}</span>
            <span className={colors.operator}>: terms on </span>
            <span className={colors.field}>{node.field}</span>
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_histogram':
        addLine(
          indent,
          <>
            <span className={colors.keyword}>{node.name}</span>
            <span className={colors.operator}>: histogram on </span>
            <span className={colors.field}>{node.field}</span>
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_date_histogram':
        addLine(
          indent,
          <>
            <span className={colors.keyword}>{node.name}</span>
            <span className={colors.operator}>: date histogram on </span>
            <span className={colors.field}>{node.field}</span>
          </>
        );
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_avg':
        addLine(
          indent,
          <>
            <span className={colors.keyword}>{node.name}</span>
            <span className={colors.operator}>: average of </span>
            <span className={colors.field}>{node.field}</span>
          </>
        );
        break;

      case 'agg_sum':
        addLine(
          indent,
          <>
            <span className={colors.keyword}>{node.name}</span>
            <span className={colors.operator}>: sum of </span>
            <span className={colors.field}>{node.field}</span>
          </>
        );
        break;

      case 'agg_cardinality':
        addLine(
          indent,
          <>
            <span className={colors.keyword}>{node.name}</span>
            <span className={colors.operator}>: cardinality of </span>
            <span className={colors.field}>{node.field}</span>
          </>
        );
        break;

      case 'size':
        addLine(indent, null); // blank line
        addLine(
          0,
          <span className={colors.sectionPagination}>Pagination</span>
        );
        addLine(
          indent + 1,
          <>
            <span className={colors.operator}>Return </span>
            <span className={colors.number}>{String(node.params.value)}</span>
            <span className={colors.operator}> results</span>
          </>
        );
        break;

      case 'from':
        addLine(
          indent,
          <>
            <span className={colors.operator}>Skip first </span>
            <span className={colors.number}>{String(node.params.value)}</span>
            <span className={colors.operator}> results</span>
          </>
        );
        break;

      case 'sort':
        addLine(indent, null); // blank line
        addLine(0, <span className={colors.sectionSort}>Sorting</span>);
        addLine(
          indent + 1,
          <>
            <span className={colors.operator}>Sort by: </span>
            <span className={colors.value}>
              {JSON.stringify(node.params.value)}
            </span>
          </>
        );
        break;

      case 'source': {
        addLine(indent, null); // blank line
        addLine(0, <span className={colors.sectionFields}>Fields</span>);
        if (Array.isArray(node.params.value)) {
          addLine(
            indent + 1,
            <>
              <span className={colors.operator}>Include: </span>
              <span className={colors.field}>
                {(node.params.value as string[]).join(', ')}
              </span>
            </>
          );
        } else if (node.params.value === false) {
          addLine(
            indent + 1,
            <span className={colors.operator}>Exclude all source fields</span>
          );
        } else if (
          typeof node.params.value === 'object' &&
          node.params.value !== null
        ) {
          const sourceObj = node.params.value as {
            includes?: string[];
            excludes?: string[];
          };
          if (sourceObj.includes && sourceObj.includes.length > 0) {
            addLine(
              indent + 1,
              <>
                <span className={colors.operator}>Include: </span>
                <span className={colors.field}>
                  {sourceObj.includes.length} fields
                </span>
              </>
            );
          }
          if (sourceObj.excludes && sourceObj.excludes.length > 0) {
            addLine(
              indent + 1,
              <>
                <span className={colors.operator}>Exclude: </span>
                <span className={colors.field}>
                  {sourceObj.excludes.length} patterns
                </span>
              </>
            );
          }
        }
        break;
      }

      default:
        if (node.field) {
          addLine(
            indent,
            <>
              <span className={colors.keyword}>{node.type}</span>
              <span className={colors.operator}>: </span>
              <span className={colors.field}>{node.field}</span>
            </>
          );
        }
        node.children.forEach((child) => processNode(child, indent + 1));
    }
  }

  processNode(root);
  return lines;
}

// Component to render the colorful summary
function ColorfulSummary({ root }: { root: ESNode }) {
  const lines = useMemo(() => generateColorfulSummary(root), [root]);

  return (
    <div className="font-mono text-xs leading-relaxed">
      {lines.map((line) => (
        <div
          key={line.key}
          style={{ paddingLeft: `${line.indent * 16}px` }}
          className={cn('py-0.5', line.elements === null && 'h-3')}
        >
          {line.elements}
        </div>
      ))}
    </div>
  );
}

export function QueryDetail({ parseResult, selectedNode }: QueryDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [copied, setCopied] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'json', label: 'JSON', icon: <Braces className="w-3.5 h-3.5" /> },
    { id: 'java', label: 'Java', icon: <FileCode className="w-3.5 h-3.5" /> },
    { id: 'curl', label: 'cURL', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'python', label: 'Python', icon: <FileCode className="w-3.5 h-3.5" /> },
  ];

  const content = useMemo(() => {
    if (!parseResult?.success || !parseResult.root) {
      return null;
    }

    const root = parseResult.root;

    switch (activeTab) {
      case 'json':
        return JSON.stringify(root.raw, null, 2);
      case 'java':
        return generateJava(root);
      case 'python':
        return generatePython(root);
      case 'curl':
        return generateCurl(root);
      default:
        return null;
    }
  }, [parseResult, activeTab]);

  const handleCopy = useCallback(async () => {
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  if (!parseResult?.success || !parseResult.root) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-sm font-medium text-muted-foreground">
            Output
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Enter a valid ES query to see output
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-white/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'summary' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        )}
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="px-4 py-2 border-b border-white/10 bg-purple-500/5">
          <span className="text-xs text-muted-foreground">
            Selected:{' '}
            <span className="text-purple-400 font-medium">
              {selectedNode.type}
              {selectedNode.field && ` (${selectedNode.field})`}
              {selectedNode.name && ` - ${selectedNode.name}`}
            </span>
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'summary' ? (
          <ColorfulSummary root={parseResult.root} />
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
