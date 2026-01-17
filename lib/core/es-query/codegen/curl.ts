// lib/core/es-query/codegen/curl.ts

import { ESNode, CodeGenOptions } from '../types';

function rebuildJson(node: ESNode): unknown {
  // Reconstruct the original JSON from the AST
  return node.raw;
}

export function generateCurl(root: ESNode, options: CodeGenOptions = {}): string {
  const host = options.host || 'localhost:9200';
  const index = options.indexName || 'INDEX_NAME';
  const prettyPrint = options.prettyPrint !== false;

  const queryBody = rebuildJson(root);
  const jsonStr = prettyPrint
    ? JSON.stringify(queryBody, null, 2)
    : JSON.stringify(queryBody);

  const lines: string[] = [];

  lines.push(`curl -X POST "${host}/${index}/_search" \\`);

  if (options.includeAuth) {
    lines.push(`  -u "USER:PASSWORD" \\`);
  }

  lines.push(`  -H "Content-Type: application/json" \\`);
  lines.push(`  -d '${jsonStr}'`);

  return lines.join('\n');
}
