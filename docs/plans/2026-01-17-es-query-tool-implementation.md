# ES Query Visualizer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web tool that visualizes Elasticsearch JSON queries as an editable tree with code generation to Java, cURL, and Python.

**Architecture:** Core parsing/codegen logic lives in `/lib/core/es-query` (pure TypeScript, no React). UI components in `/components` consume core functions. Three-panel layout: JSON input, visual tree, detail/summary panel.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, shadcn/ui, CodeMirror (editor), Lucide icons

---

## Phase 1: Project Structure & Dependencies

### Task 1: Install Additional Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install CodeMirror for the JSON editor**

Run:
```bash
npm install @codemirror/lang-json @codemirror/state @codemirror/view @codemirror/commands @codemirror/autocomplete @codemirror/lint codemirror @uiw/react-codemirror
```

**Step 2: Install uuid for generating node IDs**

Run:
```bash
npm install uuid && npm install -D @types/uuid
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add CodeMirror and uuid dependencies"
```

---

### Task 2: Create Core Library Directory Structure

**Files:**
- Create: `lib/core/es-query/index.ts`
- Create: `lib/core/es-query/types.ts`
- Create: `lib/core/es-query/parser.ts`
- Create: `lib/core/es-query/analyzer.ts`
- Create: `lib/core/es-query/codegen/index.ts`
- Create: `lib/core/es-query/codegen/java.ts`
- Create: `lib/core/es-query/codegen/python.ts`
- Create: `lib/core/es-query/codegen/curl.ts`

**Step 1: Create directory structure with placeholder files**

```bash
mkdir -p lib/core/es-query/codegen
```

**Step 2: Create types.ts with core type definitions**

```typescript
// lib/core/es-query/types.ts

export type ESNodeType =
  | 'query'
  | 'bool'
  | 'must'
  | 'should'
  | 'must_not'
  | 'filter'
  | 'match'
  | 'match_phrase'
  | 'multi_match'
  | 'term'
  | 'terms'
  | 'range'
  | 'exists'
  | 'nested'
  | 'aggs'
  | 'agg_terms'
  | 'agg_histogram'
  | 'agg_date_histogram'
  | 'agg_avg'
  | 'agg_sum'
  | 'agg_cardinality'
  | 'sort'
  | 'source'
  | 'size'
  | 'from'
  | 'unknown';

export interface ESNode {
  id: string;
  type: ESNodeType;
  name?: string; // For named clauses like aggregations
  field?: string;
  params: Record<string, unknown>;
  children: ESNode[];
  raw: unknown;
  meta: {
    collapsed: boolean;
    warning?: string;
    path: string[];
  };
}

export interface ParseResult {
  success: boolean;
  root?: ESNode;
  error?: string;
  index?: string; // Extracted index name if present
}

export interface CodeGenOptions {
  indexName?: string;
  host?: string;
  includeAuth?: boolean;
  prettyPrint?: boolean;
}
```

**Step 3: Create parser.ts with stub**

```typescript
// lib/core/es-query/parser.ts

import { ESNode, ParseResult } from './types';

export function parseESQuery(json: string): ParseResult {
  // TODO: Implement
  return { success: false, error: 'Not implemented' };
}
```

**Step 4: Create analyzer.ts with stub**

```typescript
// lib/core/es-query/analyzer.ts

import { ESNode } from './types';

export interface Suggestion {
  nodeId: string;
  message: string;
  apply: (root: ESNode) => ESNode;
}

export function analyzeSuggestions(root: ESNode): Suggestion[] {
  // TODO: Implement in v2
  return [];
}
```

**Step 5: Create codegen stubs**

```typescript
// lib/core/es-query/codegen/java.ts

import { ESNode, CodeGenOptions } from '../types';

export function generateJava(root: ESNode, options: CodeGenOptions = {}): string {
  // TODO: Implement
  return '// Not implemented';
}
```

```typescript
// lib/core/es-query/codegen/python.ts

import { ESNode, CodeGenOptions } from '../types';

export function generatePython(root: ESNode, options: CodeGenOptions = {}): string {
  // TODO: Implement
  return '# Not implemented';
}
```

```typescript
// lib/core/es-query/codegen/curl.ts

import { ESNode, CodeGenOptions } from '../types';

export function generateCurl(root: ESNode, options: CodeGenOptions = {}): string {
  // TODO: Implement
  return '# Not implemented';
}
```

```typescript
// lib/core/es-query/codegen/index.ts

export { generateJava } from './java';
export { generatePython } from './python';
export { generateCurl } from './curl';
```

**Step 6: Create main index.ts export**

```typescript
// lib/core/es-query/index.ts

export * from './types';
export { parseESQuery } from './parser';
export { analyzeSuggestions } from './analyzer';
export * from './codegen';
```

**Step 7: Commit**

```bash
git add lib/
git commit -m "chore: create es-query core library structure"
```

---

## Phase 2: ES Query Parser

### Task 3: Parser - Basic Structure Recognition

**Files:**
- Modify: `lib/core/es-query/parser.ts`
- Create: `lib/core/es-query/__tests__/parser.test.ts`

**Step 1: Set up test infrastructure**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Step 2: Write failing test for basic query parsing**

```typescript
// lib/core/es-query/__tests__/parser.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';

describe('parseESQuery', () => {
  it('should parse a simple match query', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search term',
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    expect(result.root).toBeDefined();
    expect(result.root?.type).toBe('query');
    expect(result.root?.children).toHaveLength(1);
    expect(result.root?.children[0].type).toBe('match');
    expect(result.root?.children[0].field).toBe('title');
  });

  it('should return error for invalid JSON', () => {
    const result = parseESQuery('{ invalid json }');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should parse bool query with must/should/filter', () => {
    const json = JSON.stringify({
      query: {
        bool: {
          must: [{ match: { title: 'search' } }],
          should: [{ match: { description: 'optional' } }],
          filter: [{ term: { status: 'active' } }],
        },
      },
    });

    const result = parseESQuery(json);

    expect(result.success).toBe(true);
    const boolNode = result.root?.children[0];
    expect(boolNode?.type).toBe('bool');
    expect(boolNode?.children).toHaveLength(3);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `npm test -- --run`
Expected: FAIL

**Step 4: Implement parser**

```typescript
// lib/core/es-query/parser.ts

import { v4 as uuidv4 } from 'uuid';
import { ESNode, ESNodeType, ParseResult } from './types';

const CLAUSE_TYPES: Record<string, ESNodeType> = {
  bool: 'bool',
  must: 'must',
  should: 'should',
  must_not: 'must_not',
  filter: 'filter',
  match: 'match',
  match_phrase: 'match_phrase',
  multi_match: 'multi_match',
  term: 'term',
  terms: 'terms',
  range: 'range',
  exists: 'exists',
  nested: 'nested',
};

const AGG_TYPES: Record<string, ESNodeType> = {
  terms: 'agg_terms',
  histogram: 'agg_histogram',
  date_histogram: 'agg_date_histogram',
  avg: 'agg_avg',
  sum: 'agg_sum',
  cardinality: 'agg_cardinality',
};

function shouldCollapse(value: unknown): boolean {
  if (Array.isArray(value) && value.length > 10 && typeof value[0] === 'number') {
    return true; // Embedding vectors
  }
  return false;
}

function createNode(
  type: ESNodeType,
  raw: unknown,
  path: string[],
  options: { field?: string; name?: string; params?: Record<string, unknown> } = {}
): ESNode {
  return {
    id: uuidv4(),
    type,
    field: options.field,
    name: options.name,
    params: options.params || {},
    children: [],
    raw,
    meta: {
      collapsed: shouldCollapse(raw),
      path,
    },
  };
}

function parseQueryClause(key: string, value: unknown, path: string[]): ESNode {
  const clausePath = [...path, key];

  // Bool query
  if (key === 'bool' && typeof value === 'object' && value !== null) {
    const node = createNode('bool', value, clausePath);
    const boolObj = value as Record<string, unknown>;

    for (const boolKey of ['must', 'should', 'must_not', 'filter']) {
      if (boolObj[boolKey]) {
        const clauseNode = createNode(
          CLAUSE_TYPES[boolKey] || 'unknown',
          boolObj[boolKey],
          [...clausePath, boolKey]
        );

        const clauses = Array.isArray(boolObj[boolKey])
          ? boolObj[boolKey]
          : [boolObj[boolKey]];

        (clauses as unknown[]).forEach((clause, i) => {
          if (typeof clause === 'object' && clause !== null) {
            Object.entries(clause as Record<string, unknown>).forEach(([k, v]) => {
              clauseNode.children.push(parseQueryClause(k, v, [...clausePath, boolKey, String(i)]));
            });
          }
        });

        node.children.push(clauseNode);
      }
    }

    return node;
  }

  // Match, term, etc. - field-level queries
  if (CLAUSE_TYPES[key] && typeof value === 'object' && value !== null) {
    const valueObj = value as Record<string, unknown>;
    const fieldName = Object.keys(valueObj)[0];
    const fieldValue = valueObj[fieldName];

    const params: Record<string, unknown> =
      typeof fieldValue === 'object' && fieldValue !== null
        ? (fieldValue as Record<string, unknown>)
        : { value: fieldValue };

    return createNode(CLAUSE_TYPES[key], value, clausePath, {
      field: fieldName,
      params,
    });
  }

  // Unknown clause
  return createNode('unknown', value, clausePath, {
    params: typeof value === 'object' ? (value as Record<string, unknown>) : { value },
  });
}

function parseAggregations(aggs: Record<string, unknown>, path: string[]): ESNode[] {
  const nodes: ESNode[] = [];

  for (const [aggName, aggDef] of Object.entries(aggs)) {
    if (typeof aggDef !== 'object' || aggDef === null) continue;

    const aggObj = aggDef as Record<string, unknown>;
    const aggPath = [...path, aggName];

    // Find the aggregation type
    for (const [aggType, typeMapping] of Object.entries(AGG_TYPES)) {
      if (aggObj[aggType]) {
        const aggConfig = aggObj[aggType] as Record<string, unknown>;
        const node = createNode(typeMapping, aggDef, aggPath, {
          name: aggName,
          field: aggConfig.field as string | undefined,
          params: aggConfig,
        });

        // Handle nested aggregations
        if (aggObj.aggs || aggObj.aggregations) {
          const nestedAggs = (aggObj.aggs || aggObj.aggregations) as Record<string, unknown>;
          node.children.push(...parseAggregations(nestedAggs, [...aggPath, 'aggs']));
        }

        nodes.push(node);
        break;
      }
    }
  }

  return nodes;
}

export function parseESQuery(json: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return {
      success: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      error: 'Expected an object at root level',
    };
  }

  const root = createNode('query', parsed, []);
  const obj = parsed as Record<string, unknown>;

  // Parse query
  if (obj.query && typeof obj.query === 'object') {
    const queryObj = obj.query as Record<string, unknown>;
    for (const [key, value] of Object.entries(queryObj)) {
      root.children.push(parseQueryClause(key, value, ['query']));
    }
  }

  // Parse aggregations
  const aggs = obj.aggs || obj.aggregations;
  if (aggs && typeof aggs === 'object') {
    const aggsNode = createNode('aggs', aggs, ['aggs']);
    aggsNode.children.push(...parseAggregations(aggs as Record<string, unknown>, ['aggs']));
    root.children.push(aggsNode);
  }

  // Parse size, from, sort, _source
  if (typeof obj.size === 'number') {
    root.children.push(createNode('size', obj.size, ['size'], { params: { value: obj.size } }));
  }
  if (typeof obj.from === 'number') {
    root.children.push(createNode('from', obj.from, ['from'], { params: { value: obj.from } }));
  }
  if (obj.sort) {
    root.children.push(createNode('sort', obj.sort, ['sort'], { params: { value: obj.sort } }));
  }
  if (obj._source !== undefined) {
    root.children.push(
      createNode('source', obj._source, ['_source'], { params: { value: obj._source } })
    );
  }

  return {
    success: true,
    root,
  };
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- --run`
Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement ES query parser with bool, match, term support"
```

---

### Task 4: Parser - Range and Exists Queries

**Files:**
- Modify: `lib/core/es-query/__tests__/parser.test.ts`
- Modify: `lib/core/es-query/parser.ts` (if needed)

**Step 1: Write failing tests for range and exists**

Add to `parser.test.ts`:
```typescript
it('should parse range query', () => {
  const json = JSON.stringify({
    query: {
      range: {
        price: {
          gte: 10,
          lte: 100,
        },
      },
    },
  });

  const result = parseESQuery(json);

  expect(result.success).toBe(true);
  const rangeNode = result.root?.children[0];
  expect(rangeNode?.type).toBe('range');
  expect(rangeNode?.field).toBe('price');
  expect(rangeNode?.params.gte).toBe(10);
  expect(rangeNode?.params.lte).toBe(100);
});

it('should parse exists query', () => {
  const json = JSON.stringify({
    query: {
      exists: {
        field: 'user',
      },
    },
  });

  const result = parseESQuery(json);

  expect(result.success).toBe(true);
  const existsNode = result.root?.children[0];
  expect(existsNode?.type).toBe('exists');
  expect(existsNode?.params.field).toBe('user');
});
```

**Step 2: Run tests**

Run: `npm test -- --run`
Expected: Should pass (already implemented in parser)

**Step 3: Commit if changes needed**

```bash
git add -A
git commit -m "test: add range and exists query parser tests"
```

---

### Task 5: Parser - Aggregations

**Files:**
- Modify: `lib/core/es-query/__tests__/parser.test.ts`

**Step 1: Write tests for aggregations**

Add to `parser.test.ts`:
```typescript
it('should parse terms aggregation', () => {
  const json = JSON.stringify({
    aggs: {
      categories: {
        terms: {
          field: 'category',
          size: 10,
        },
      },
    },
  });

  const result = parseESQuery(json);

  expect(result.success).toBe(true);
  const aggsNode = result.root?.children.find((c) => c.type === 'aggs');
  expect(aggsNode).toBeDefined();
  expect(aggsNode?.children).toHaveLength(1);
  expect(aggsNode?.children[0].type).toBe('agg_terms');
  expect(aggsNode?.children[0].name).toBe('categories');
  expect(aggsNode?.children[0].field).toBe('category');
});

it('should parse nested aggregations', () => {
  const json = JSON.stringify({
    aggs: {
      categories: {
        terms: {
          field: 'category',
        },
        aggs: {
          avg_price: {
            avg: {
              field: 'price',
            },
          },
        },
      },
    },
  });

  const result = parseESQuery(json);

  expect(result.success).toBe(true);
  const aggsNode = result.root?.children.find((c) => c.type === 'aggs');
  const termsAgg = aggsNode?.children[0];
  expect(termsAgg?.children).toHaveLength(1);
  expect(termsAgg?.children[0].type).toBe('agg_avg');
  expect(termsAgg?.children[0].name).toBe('avg_price');
});
```

**Step 2: Run tests**

Run: `npm test -- --run`
Expected: PASS

**Step 3: Commit**

```bash
git add -A
git commit -m "test: add aggregation parser tests"
```

---

## Phase 3: Code Generation

### Task 6: cURL Code Generator

**Files:**
- Modify: `lib/core/es-query/codegen/curl.ts`
- Create: `lib/core/es-query/__tests__/codegen-curl.test.ts`

**Step 1: Write failing test**

```typescript
// lib/core/es-query/__tests__/codegen-curl.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';
import { generateCurl } from '../codegen/curl';

describe('generateCurl', () => {
  it('should generate basic curl command', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search',
        },
      },
    });

    const result = parseESQuery(json);
    const curl = generateCurl(result.root!, {
      indexName: 'products',
      host: 'localhost:9200',
    });

    expect(curl).toContain('curl');
    expect(curl).toContain('localhost:9200/products/_search');
    expect(curl).toContain('"match"');
  });

  it('should include auth placeholder when requested', () => {
    const json = JSON.stringify({ query: { match_all: {} } });
    const result = parseESQuery(json);
    const curl = generateCurl(result.root!, {
      indexName: 'test',
      includeAuth: true,
    });

    expect(curl).toContain('-u');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run codegen-curl`
Expected: FAIL

**Step 3: Implement cURL generator**

```typescript
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
  const jsonStr = prettyPrint ? JSON.stringify(queryBody, null, 2) : JSON.stringify(queryBody);

  const lines: string[] = [];

  lines.push(`curl -X POST "${host}/${index}/_search" \\`);

  if (options.includeAuth) {
    lines.push(`  -u "USER:PASSWORD" \\`);
  }

  lines.push(`  -H "Content-Type: application/json" \\`);
  lines.push(`  -d '${jsonStr}'`);

  return lines.join('\n');
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run codegen-curl`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement cURL code generator"
```

---

### Task 7: Python Code Generator

**Files:**
- Modify: `lib/core/es-query/codegen/python.ts`
- Create: `lib/core/es-query/__tests__/codegen-python.test.ts`

**Step 1: Write failing test**

```typescript
// lib/core/es-query/__tests__/codegen-python.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';
import { generatePython } from '../codegen/python';

describe('generatePython', () => {
  it('should generate elasticsearch-py code', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search',
        },
      },
    });

    const result = parseESQuery(json);
    const python = generatePython(result.root!, { indexName: 'products' });

    expect(python).toContain('client.search');
    expect(python).toContain('index="products"');
    expect(python).toContain('match');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run codegen-python`
Expected: FAIL

**Step 3: Implement Python generator**

```typescript
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
    const items = entries.map(([k, v]) => `"${k}": ${toPythonDict(v, indent + 1)}`);
    return `{\n${padInner}${items.join(`,\n${padInner}`)}\n${pad}}`;
  }

  return String(obj);
}

export function generatePython(root: ESNode, options: CodeGenOptions = {}): string {
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
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run codegen-python`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement Python code generator"
```

---

### Task 8: Java Code Generator

**Files:**
- Modify: `lib/core/es-query/codegen/java.ts`
- Create: `lib/core/es-query/__tests__/codegen-java.test.ts`

**Step 1: Write failing test**

```typescript
// lib/core/es-query/__tests__/codegen-java.test.ts

import { describe, it, expect } from 'vitest';
import { parseESQuery } from '../parser';
import { generateJava } from '../codegen/java';

describe('generateJava', () => {
  it('should generate Java client code for match query', () => {
    const json = JSON.stringify({
      query: {
        match: {
          title: 'search',
        },
      },
    });

    const result = parseESQuery(json);
    const java = generateJava(result.root!, { indexName: 'products' });

    expect(java).toContain('SearchRequest');
    expect(java).toContain('.index("products")');
    expect(java).toContain('match');
  });

  it('should generate Java client code for bool query', () => {
    const json = JSON.stringify({
      query: {
        bool: {
          must: [{ match: { title: 'search' } }],
          filter: [{ term: { status: 'active' } }],
        },
      },
    });

    const result = parseESQuery(json);
    const java = generateJava(result.root!, { indexName: 'products' });

    expect(java).toContain('bool');
    expect(java).toContain('must');
    expect(java).toContain('filter');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run codegen-java`
Expected: FAIL

**Step 3: Implement Java generator**

```typescript
// lib/core/es-query/codegen/java.ts

import { ESNode, CodeGenOptions } from '../types';

function indent(level: number): string {
  return '    '.repeat(level);
}

function generateQueryBuilder(query: unknown, level: number = 2): string {
  if (typeof query !== 'object' || query === null) {
    return `"${query}"`;
  }

  const obj = query as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 0) return 'matchAll()';

  const key = keys[0];
  const value = obj[key];

  switch (key) {
    case 'match': {
      const matchObj = value as Record<string, unknown>;
      const field = Object.keys(matchObj)[0];
      const matchValue = matchObj[field];
      const queryValue = typeof matchValue === 'object' ? (matchValue as Record<string, unknown>).query : matchValue;
      return `match(m -> m.field("${field}").query("${queryValue}"))`;
    }

    case 'term': {
      const termObj = value as Record<string, unknown>;
      const field = Object.keys(termObj)[0];
      const termValue = termObj[field];
      const actualValue = typeof termValue === 'object' ? (termValue as Record<string, unknown>).value : termValue;
      return `term(t -> t.field("${field}").value("${actualValue}"))`;
    }

    case 'range': {
      const rangeObj = value as Record<string, unknown>;
      const field = Object.keys(rangeObj)[0];
      const rangeParams = rangeObj[field] as Record<string, unknown>;
      const parts: string[] = [`field("${field}")`];
      if (rangeParams.gte !== undefined) parts.push(`gte(JsonData.of(${rangeParams.gte}))`);
      if (rangeParams.gt !== undefined) parts.push(`gt(JsonData.of(${rangeParams.gt}))`);
      if (rangeParams.lte !== undefined) parts.push(`lte(JsonData.of(${rangeParams.lte}))`);
      if (rangeParams.lt !== undefined) parts.push(`lt(JsonData.of(${rangeParams.lt}))`);
      return `range(r -> r.${parts.join('.')})`;
    }

    case 'bool': {
      const boolObj = value as Record<string, unknown>;
      const parts: string[] = [];

      if (boolObj.must) {
        const musts = Array.isArray(boolObj.must) ? boolObj.must : [boolObj.must];
        musts.forEach((m) => {
          parts.push(`${indent(level + 1)}.must(q -> q.${generateQueryBuilder(m, level + 2)})`);
        });
      }

      if (boolObj.should) {
        const shoulds = Array.isArray(boolObj.should) ? boolObj.should : [boolObj.should];
        shoulds.forEach((s) => {
          parts.push(`${indent(level + 1)}.should(q -> q.${generateQueryBuilder(s, level + 2)})`);
        });
      }

      if (boolObj.filter) {
        const filters = Array.isArray(boolObj.filter) ? boolObj.filter : [boolObj.filter];
        filters.forEach((f) => {
          parts.push(`${indent(level + 1)}.filter(q -> q.${generateQueryBuilder(f, level + 2)})`);
        });
      }

      if (boolObj.must_not) {
        const mustNots = Array.isArray(boolObj.must_not) ? boolObj.must_not : [boolObj.must_not];
        mustNots.forEach((mn) => {
          parts.push(`${indent(level + 1)}.mustNot(q -> q.${generateQueryBuilder(mn, level + 2)})`);
        });
      }

      return `bool(b -> b\n${parts.join('\n')}\n${indent(level)})`;
    }

    case 'exists': {
      const existsObj = value as Record<string, unknown>;
      return `exists(e -> e.field("${existsObj.field}"))`;
    }

    default:
      return `// TODO: Implement ${key} query type`;
  }
}

export function generateJava(root: ESNode, options: CodeGenOptions = {}): string {
  const index = options.indexName || 'INDEX_NAME';
  const raw = root.raw as Record<string, unknown>;

  const lines: string[] = [];

  lines.push('import co.elastic.clients.elasticsearch.ElasticsearchClient;');
  lines.push('import co.elastic.clients.elasticsearch.core.SearchRequest;');
  lines.push('import co.elastic.clients.elasticsearch.core.SearchResponse;');
  lines.push('import co.elastic.clients.json.JsonData;');
  lines.push('');

  lines.push('SearchRequest request = SearchRequest.of(s -> s');
  lines.push(`    .index("${index}")`);

  if (raw.query) {
    const queryCode = generateQueryBuilder(raw.query, 2);
    lines.push(`    .query(q -> q.${queryCode})`);
  }

  if (raw.size !== undefined) {
    lines.push(`    .size(${raw.size})`);
  }

  if (raw.from !== undefined) {
    lines.push(`    .from(${raw.from})`);
  }

  lines.push(');');
  lines.push('');
  lines.push('SearchResponse<Object> response = client.search(request, Object.class);');

  return lines.join('\n');
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run codegen-java`
Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement Java code generator"
```

---

## Phase 4: UI - App Shell & Sidebar

### Task 9: Create App Layout with Sidebar

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/app-shell.tsx`
- Modify: `app/globals.css`

**Step 1: Update globals.css with glassmorphism variables**

```css
/* app/globals.css - add these CSS variables */

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 4%;
  --foreground: 0 0% 98%;
  --card: 240 10% 4%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 4%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 20%;
  --input: 240 3.7% 20%;
  --ring: 240 4.9% 83.9%;

  /* Glassmorphism */
  --glass-bg: rgba(10, 10, 11, 0.8);
  --glass-border: rgba(255, 255, 255, 0.1);
  --accent-gradient: linear-gradient(180deg, #7c3aed 0%, #3b82f6 100%);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--glass-border);
}
```

**Step 2: Create Sidebar component**

```typescript
// components/layout/sidebar.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Search,
  Settings,
  Moon,
  Sun,
  Braces,
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const tools: Tool[] = [
  {
    id: 'es-query',
    name: 'ES Query',
    description: 'Visualize & edit Elasticsearch queries',
    icon: <Braces className="w-5 h-5" />,
    href: '/tools/es-query',
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <aside
      className={cn(
        'glass h-screen flex flex-col transition-all duration-300 ease-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <Link href="/" className="text-lg font-semibold text-foreground">
            DevTools
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <ChevronLeft
            className={cn(
              'w-4 h-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* Tools list */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {tools.map((tool) => {
          const isActive = pathname === tool.href;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <span
                className={cn(
                  'transition-transform group-hover:scale-110',
                  isActive && 'text-purple-400'
                )}
              >
                {tool.icon}
              </span>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{tool.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {tool.description}
                  </div>
                </div>
              )}
              {isActive && (
                <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full absolute left-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 flex items-center justify-around">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {!collapsed && (
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
```

**Step 3: Create AppShell component**

```typescript
// components/layout/app-shell.tsx

import { Sidebar } from './sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background dark">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
```

**Step 4: Update layout.tsx**

```typescript
// app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevTools',
  description: 'Developer productivity tools',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

**Step 5: Run dev server and verify**

Run: `npm run dev`
Expected: Sidebar visible, dark theme, tool link works

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell with glassmorphism sidebar"
```

---

### Task 10: Create Home Page (Tool Launcher)

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update home page with tool grid**

```typescript
// app/page.tsx

import Link from 'next/link';
import { Braces } from 'lucide-react';

const tools = [
  {
    id: 'es-query',
    name: 'ES Query Visualizer',
    description:
      'Paste Elasticsearch JSON queries and visualize them as an editable tree. Generate code for Java, Python, and cURL.',
    icon: <Braces className="w-8 h-8" />,
    href: '/tools/es-query',
    gradient: 'from-purple-500 to-blue-500',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">DevTools</h1>
        <p className="text-muted-foreground mb-8">
          Developer productivity tools that don&apos;t suck.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                {tool.icon}
              </div>
              <h2 className="text-lg font-semibold mb-2">{tool.name}</h2>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify in browser**

Run: `npm run dev`
Navigate to: http://localhost:3000
Expected: Tool grid displayed, clicking card goes to /tools/es-query

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add home page with tool launcher grid"
```

---

## Phase 5: ES Query Tool UI

### Task 11: Create ES Query Tool Page Structure

**Files:**
- Create: `app/tools/es-query/page.tsx`
- Create: `components/es-query/query-input.tsx`
- Create: `components/es-query/query-tree.tsx`
- Create: `components/es-query/query-detail.tsx`

**Step 1: Create the tool page**

```typescript
// app/tools/es-query/page.tsx

'use client';

import { useState, useCallback } from 'react';
import { parseESQuery, ESNode, ParseResult } from '@/lib/core/es-query';
import { QueryInput } from '@/components/es-query/query-input';
import { QueryTree } from '@/components/es-query/query-tree';
import { QueryDetail } from '@/components/es-query/query-detail';

const SAMPLE_QUERY = JSON.stringify(
  {
    query: {
      bool: {
        must: [{ match: { title: 'search term' } }],
        filter: [{ term: { status: 'active' } }, { range: { price: { gte: 10, lte: 100 } } }],
      },
    },
    aggs: {
      categories: {
        terms: { field: 'category', size: 10 },
      },
    },
    size: 20,
  },
  null,
  2
);

export default function ESQueryPage() {
  const [input, setInput] = useState(SAMPLE_QUERY);
  const [parseResult, setParseResult] = useState<ParseResult>(() => parseESQuery(SAMPLE_QUERY));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    const result = parseESQuery(value);
    setParseResult(result);
    if (!result.success) {
      setSelectedNodeId(null);
    }
  }, []);

  const selectedNode = parseResult.root
    ? findNodeById(parseResult.root, selectedNodeId)
    : null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-semibold">ES Query Visualizer</h1>
        <p className="text-sm text-muted-foreground">
          Paste, visualize, edit, and export Elasticsearch queries
        </p>
      </header>

      {/* Three panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Input panel */}
        <div className="w-1/3 border-r border-white/10 flex flex-col">
          <QueryInput value={input} onChange={handleInputChange} error={parseResult.error} />
        </div>

        {/* Tree panel */}
        <div className="w-1/3 border-r border-white/10 flex flex-col">
          <QueryTree
            root={parseResult.root}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {/* Detail panel */}
        <div className="w-1/3 flex flex-col">
          <QueryDetail
            root={parseResult.root}
            selectedNode={selectedNode}
            input={input}
            onUpdateInput={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}

function findNodeById(node: ESNode, id: string | null): ESNode | null {
  if (!id) return null;
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
```

**Step 2: Create QueryInput component**

```typescript
// components/es-query/query-input.tsx

'use client';

import { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function QueryInput({ value, onChange, error }: QueryInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Invalid JSON, can't format
    }
  }, [value, onChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-medium">JSON Input</span>
        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            className="px-2 py-1 text-xs rounded hover:bg-white/10 transition-colors"
          >
            Format
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs rounded hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[json()]}
          onChange={onChange}
          className="h-full text-sm"
        />
      </div>

      {/* Status bar */}
      <div
        className={`px-4 py-2 text-xs border-t ${
          error ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'border-white/10 text-green-400'
        }`}
      >
        {error || 'Valid ES Query'}
      </div>
    </div>
  );
}
```

**Step 3: Create QueryTree component**

```typescript
// components/es-query/query-tree.tsx

'use client';

import { ESNode } from '@/lib/core/es-query';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, X, Copy, Braces } from 'lucide-react';
import { useState, useCallback } from 'react';

interface QueryTreeProps {
  root?: ESNode;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

const TYPE_COLORS: Record<string, string> = {
  query: 'bg-slate-500',
  bool: 'bg-purple-500',
  must: 'bg-blue-500',
  should: 'bg-blue-400',
  must_not: 'bg-red-400',
  filter: 'bg-blue-600',
  match: 'bg-green-500',
  match_phrase: 'bg-green-500',
  multi_match: 'bg-green-500',
  term: 'bg-green-600',
  terms: 'bg-green-600',
  range: 'bg-green-700',
  exists: 'bg-green-700',
  nested: 'bg-cyan-500',
  aggs: 'bg-orange-500',
  agg_terms: 'bg-orange-400',
  agg_histogram: 'bg-orange-400',
  agg_date_histogram: 'bg-orange-400',
  agg_avg: 'bg-orange-300',
  agg_sum: 'bg-orange-300',
  agg_cardinality: 'bg-orange-300',
  sort: 'bg-slate-400',
  size: 'bg-slate-400',
  from: 'bg-slate-400',
  source: 'bg-slate-400',
  unknown: 'bg-gray-500',
};

export function QueryTree({ root, selectedNodeId, onSelectNode }: QueryTreeProps) {
  if (!root) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Fix JSON errors to see visualization
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-medium">Query Structure</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-4">
        <TreeNode
          node={root}
          depth={0}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
        />
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: ESNode;
  depth: number;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

function TreeNode({ node, depth, selectedNodeId, onSelectNode }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(!node.meta.collapsed);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedNodeId;

  const getLabel = () => {
    if (node.name) return `${node.type}: ${node.name}`;
    if (node.field) return `${node.type}: ${node.field}`;
    return node.type;
  };

  const getPreview = () => {
    if (node.type === 'size' || node.type === 'from') {
      return String(node.params.value);
    }
    if (node.params.value !== undefined && typeof node.params.value !== 'object') {
      return `"${node.params.value}"`;
    }
    if (node.params.query !== undefined) {
      return `"${node.params.query}"`;
    }
    if (node.params.gte !== undefined || node.params.lte !== undefined) {
      const parts = [];
      if (node.params.gte !== undefined) parts.push(`>=${node.params.gte}`);
      if (node.params.lte !== undefined) parts.push(`<=${node.params.lte}`);
      return parts.join(', ');
    }
    return null;
  };

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-all group',
          isSelected ? 'bg-purple-500/20 ring-1 ring-purple-500/50' : 'hover:bg-white/5'
        )}
        onClick={() => onSelectNode(node.id)}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
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
          {getLabel()}
        </span>

        {/* Value preview */}
        {getPreview() && (
          <span className="text-xs text-muted-foreground truncate">{getPreview()}</span>
        )}

        {/* Quick actions on hover */}
        <div className="ml-auto opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button className="p-1 hover:bg-white/10 rounded" title="Remove">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children */}
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
          />
        ))}
    </div>
  );
}
```

**Step 4: Create QueryDetail component**

```typescript
// components/es-query/query-detail.tsx

'use client';

import { ESNode } from '@/lib/core/es-query';
import { generateJava, generatePython, generateCurl } from '@/lib/core/es-query';
import { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

interface QueryDetailProps {
  root?: ESNode;
  selectedNode: ESNode | null;
  input: string;
  onUpdateInput: (value: string) => void;
}

export function QueryDetail({ root, selectedNode, input }: QueryDetailProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'java' | 'python' | 'curl'>('summary');
  const [copied, setCopied] = useState(false);

  const codeOutput = useMemo(() => {
    if (!root) return '';
    const options = { indexName: 'INDEX_NAME', host: 'localhost:9200' };
    switch (activeTab) {
      case 'java':
        return generateJava(root, options);
      case 'python':
        return generatePython(root, options);
      case 'curl':
        return generateCurl(root, options);
      default:
        return '';
    }
  }, [root, activeTab]);

  const handleCopy = async () => {
    const textToCopy = activeTab === 'summary' ? '' : codeOutput;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!root) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Parse a valid query to see details
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-4">
        {(['summary', 'java', 'curl', 'python'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'text-sm capitalize transition-colors',
              activeTab === tab
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
        {activeTab !== 'summary' && (
          <button
            onClick={handleCopy}
            className="ml-auto px-2 py-1 text-xs rounded hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'summary' ? (
          <QuerySummary root={root} selectedNode={selectedNode} />
        ) : (
          <pre className="text-sm font-mono whitespace-pre-wrap">{codeOutput}</pre>
        )}
      </div>
    </div>
  );
}

function QuerySummary({ root, selectedNode }: { root: ESNode; selectedNode: ESNode | null }) {
  const raw = root.raw as Record<string, unknown>;

  return (
    <div className="space-y-4 text-sm">
      {/* Query section */}
      {raw.query && (
        <div>
          <h3 className="font-medium mb-2">Query</h3>
          <QueryNodeSummary node={root.children.find((c) => c.type !== 'aggs' && c.type !== 'size' && c.type !== 'from' && c.type !== 'sort')!} />
        </div>
      )}

      {/* Aggregations */}
      {root.children.find((c) => c.type === 'aggs') && (
        <div>
          <h3 className="font-medium mb-2">Aggregations</h3>
          <ul className="space-y-1 text-muted-foreground">
            {root.children
              .find((c) => c.type === 'aggs')
              ?.children.map((agg) => (
                <li key={agg.id}>
                  <code className="text-purple-400">{agg.name}</code>: {agg.type.replace('agg_', '')} on{' '}
                  <code className="text-green-400">{agg.field}</code>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Size/From */}
      {(raw.size !== undefined || raw.from !== undefined) && (
        <div>
          <h3 className="font-medium mb-2">Pagination</h3>
          <p className="text-muted-foreground">
            Return <code className="text-blue-400">{raw.size ?? 10}</code> results
            {raw.from ? (
              <>
                , starting from <code className="text-blue-400">{raw.from}</code>
              </>
            ) : null}
          </p>
        </div>
      )}
    </div>
  );
}

function QueryNodeSummary({ node }: { node: ESNode }) {
  if (!node) return null;

  switch (node.type) {
    case 'bool':
      return (
        <div className="space-y-2">
          {node.children.map((clause) => (
            <div key={clause.id}>
              <span className="text-blue-400 font-medium">{clause.type.toUpperCase()}</span>
              <ul className="ml-4 space-y-1">
                {clause.children.map((condition) => (
                  <li key={condition.id} className="text-muted-foreground">
                    <code className="text-green-400">{condition.field}</code>{' '}
                    {condition.type === 'match' && 'matches'}
                    {condition.type === 'term' && '='}
                    {condition.type === 'range' && 'in range'}{' '}
                    <code className="text-yellow-400">
                      {condition.params.value !== undefined
                        ? `"${condition.params.value}"`
                        : condition.params.query !== undefined
                        ? `"${condition.params.query}"`
                        : `${condition.params.gte ?? '*'} to ${condition.params.lte ?? '*'}`}
                    </code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'match':
      return (
        <p className="text-muted-foreground">
          <code className="text-green-400">{node.field}</code> matches{' '}
          <code className="text-yellow-400">"{node.params.value || node.params.query}"</code>
        </p>
      );

    default:
      return <p className="text-muted-foreground">{node.type} query</p>;
  }
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
```

**Step 5: Run dev server and verify**

Run: `npm run dev`
Navigate to: http://localhost:3000/tools/es-query
Expected: Three panel layout with sample query loaded

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ES Query tool page with three panel layout"
```

---

## Phase 6: Final Polish

### Task 12: Build Verification & Cleanup

**Step 1: Run linter**

Run: `npm run lint`
Fix any issues found.

**Step 2: Run tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: fix lint issues and verify build"
```

---

## Summary

**What was built:**
- Core ES query parser (pure TypeScript, no React dependencies)
- Code generators for Java, cURL, and Python
- Glassmorphism sidebar with tool navigation
- Three-panel ES Query tool: JSON input, visual tree, detail/code view
- Copy to clipboard, format JSON, tab between code outputs

**What's ready for v2:**
- Simplification suggestions (analyzer.ts stubbed)
- More query types (nested, script, function_score)
- Quick actions (delete, duplicate, wrap nodes)
- Undo/redo history
- Index mapping autocomplete