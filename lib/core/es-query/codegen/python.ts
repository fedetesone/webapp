// lib/core/es-query/codegen/python.ts

import { ESNode, CodeGenOptions } from '../types';

function toPythonDict(obj: unknown, indent: number = 0): string {
  const pad = '    '.repeat(indent);
  const padInner = '    '.repeat(indent + 1);

  if (obj === null) return 'None';
  if (typeof obj === 'boolean') return obj ? 'True' : 'False';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map((item) => toPythonDict(item, indent + 1));
    return `[\n${padInner}${items.join(`,\n${padInner}`)}\n${pad}]`;
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const items = entries.map(
      ([k, v]) => `"${k}": ${toPythonDict(v, indent + 1)}`
    );
    return `{\n${padInner}${items.join(`,\n${padInner}`)}\n${pad}}`;
  }

  return String(obj);
}

export function generatePython(
  root: ESNode,
  options: CodeGenOptions = {}
): string {
  const index = options.indexName || 'INDEX_NAME';
  const raw = root.raw as Record<string, unknown>;

  const lines: string[] = [];
  lines.push('from elasticsearch import Elasticsearch');
  lines.push('');
  lines.push('client = Elasticsearch()');
  lines.push('');

  const args: string[] = [];
  args.push(`index="${index}"`);

  if (raw.query) {
    args.push(`query=${toPythonDict(raw.query, 1)}`);
  }

  if (raw.aggs || raw.aggregations) {
    args.push(`aggs=${toPythonDict(raw.aggs || raw.aggregations, 1)}`);
  }

  if (raw.size !== undefined) {
    args.push(`size=${raw.size}`);
  }

  if (raw.from !== undefined) {
    args.push(`from_=${raw.from}`);
  }

  if (raw.sort) {
    args.push(`sort=${toPythonDict(raw.sort, 1)}`);
  }

  lines.push(`response = client.search(`);
  lines.push(`    ${args.join(',\n    ')}`);
  lines.push(`)`);

  return lines.join('\n');
}
