'use client';

import { useState, useCallback, useMemo } from 'react';
import { Check, Copy, FileCode, Terminal, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ESNode,
  ParseResult,
  generateJava,
  generatePython,
  generateCurl,
} from '@/lib/core/es-query';
import { cn } from '@/lib/utils';

type TabType = 'summary' | 'java' | 'curl' | 'python';

interface QueryDetailProps {
  parseResult: ParseResult | null;
  selectedNode: ESNode | null;
}

// Generate human-readable summary of the query
function generateSummary(root: ESNode): string {
  const lines: string[] = [];

  function processNode(node: ESNode, indent: number = 0): void {
    const pad = '  '.repeat(indent);

    switch (node.type) {
      case 'query':
        lines.push('Query');
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'bool':
        node.children.forEach((child) => processNode(child, indent));
        break;

      case 'must':
        lines.push(`${pad}MUST`);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'should':
        lines.push(`${pad}SHOULD`);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'must_not':
        lines.push(`${pad}MUST NOT`);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'filter':
        lines.push(`${pad}FILTER`);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'match':
      case 'match_phrase': {
        const verb = node.type === 'match' ? 'matches' : 'matches phrase';
        const value = node.params.query || node.params.value;
        lines.push(`${pad}${node.field} ${verb} "${value}"`);
        break;
      }

      case 'term': {
        const value = node.params.value;
        lines.push(`${pad}${node.field} = "${value}"`);
        break;
      }

      case 'terms': {
        const values = node.params.values || node.params.value;
        if (Array.isArray(values)) {
          lines.push(`${pad}${node.field} in [${values.length} values]`);
        }
        break;
      }

      case 'range': {
        const parts: string[] = [];
        if (node.params.gte !== undefined) parts.push(`>= ${node.params.gte}`);
        if (node.params.gt !== undefined) parts.push(`> ${node.params.gt}`);
        if (node.params.lte !== undefined) parts.push(`<= ${node.params.lte}`);
        if (node.params.lt !== undefined) parts.push(`< ${node.params.lt}`);
        if (parts.length === 2 && node.params.gte !== undefined && node.params.lte !== undefined) {
          lines.push(`${pad}${node.field} in range ${node.params.gte} to ${node.params.lte}`);
        } else {
          lines.push(`${pad}${node.field} ${parts.join(' and ')}`);
        }
        break;
      }

      case 'exists':
        lines.push(`${pad}${node.params.field} exists`);
        break;

      case 'aggs':
        lines.push('');
        lines.push('Aggregations');
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_terms':
        lines.push(`${pad}${node.name}: terms on ${node.field}`);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_histogram':
        lines.push(`${pad}${node.name}: histogram on ${node.field}`);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_date_histogram':
        lines.push(`${pad}${node.name}: date histogram on ${node.field}`);
        node.children.forEach((child) => processNode(child, indent + 1));
        break;

      case 'agg_avg':
        lines.push(`${pad}${node.name}: average of ${node.field}`);
        break;

      case 'agg_sum':
        lines.push(`${pad}${node.name}: sum of ${node.field}`);
        break;

      case 'agg_cardinality':
        lines.push(`${pad}${node.name}: cardinality of ${node.field}`);
        break;

      case 'size':
        lines.push('');
        lines.push('Pagination');
        lines.push(`${pad}Return ${node.params.value} results`);
        break;

      case 'from':
        lines.push(`${pad}Skip first ${node.params.value} results`);
        break;

      case 'sort':
        lines.push('');
        lines.push('Sorting');
        lines.push(`${pad}Sort by: ${JSON.stringify(node.params.value)}`);
        break;

      case 'source':
        lines.push('');
        lines.push('Fields');
        if (Array.isArray(node.params.value)) {
          lines.push(`${pad}Include: ${(node.params.value as string[]).join(', ')}`);
        } else if (node.params.value === false) {
          lines.push(`${pad}Exclude all source fields`);
        }
        break;

      default:
        if (node.field) {
          lines.push(`${pad}${node.type}: ${node.field}`);
        }
        node.children.forEach((child) => processNode(child, indent + 1));
    }
  }

  processNode(root);
  return lines.join('\n');
}

export function QueryDetail({ parseResult, selectedNode }: QueryDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [copied, setCopied] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'summary', label: 'Summary', icon: <FileText className="w-3.5 h-3.5" /> },
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
      case 'summary':
        return generateSummary(root);
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
        <pre
          className={cn(
            'text-xs font-mono whitespace-pre-wrap',
            activeTab === 'summary' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {content}
        </pre>
      </div>
    </div>
  );
}
